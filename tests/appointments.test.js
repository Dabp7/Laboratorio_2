import {before,after,beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {createApp} from '../configs/server.js';
import User from '../src/user/user.model.js';
import Pet from '../src/pet/pet.model.js';
import Appointment from '../src/appointment/appointment.model.js';
import {access,readdir,unlink,rmdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
let mongo,app,alice,bob,admin,pet,otherPet,aliceToken,bobToken,adminToken,date;
process.env.SECRETORPRIVATEKEY='synthetic-test-only-secret-more-than-32-characters';
const auth=token=>({Authorization:'Bearer '+token});
before(async()=>{
    mongo=await MongoMemoryReplSet.create({binary:{version:'8.0.16'},instanceOpts:[{launchTimeout:60000,args:['--wiredTigerCacheSizeGB','0.25']}],replSet:{count:1,storageEngine:'wiredTiger'}});
    await mongoose.connect(mongo.getUri());
    await Promise.all([User.init(),Pet.init(),Appointment.init()]);
    app=createApp();
});
after(async()=>{await mongoose.disconnect();if(mongo)await mongo.stop();});
beforeEach(async()=>{
    await Promise.all([User.deleteMany({}),Pet.deleteMany({}),Appointment.deleteMany({})]);
    [alice,bob,admin]=await User.create(['alice','bob','admin'].map(name=>({name,surname:'Demo',username:name,email:name+'@example.test',password:'not-a-real-hash',phone:'00000000',role:name==='admin'?'ADMIN_ROLE':'USER_ROLE'})));
    aliceToken=jwt.sign({uid:alice.id},process.env.SECRETORPRIVATEKEY);
    bobToken=jwt.sign({uid:bob.id},process.env.SECRETORPRIVATEKEY);
    adminToken=jwt.sign({uid:admin.id},process.env.SECRETORPRIVATEKEY);
    [pet,otherPet]=await Pet.create([{name:'Luna',description:'Synthetic profile',age:3,type:'DOG',keeper:alice.id},{name:'Sol',description:'Synthetic profile',age:2,type:'CAT',keeper:bob.id}]);
    const future=new Date(Date.now()+86400000);future.setUTCMinutes(0,0,0);date=future.toISOString();
});
const book=(token,petId=pet.id,at=date,extra={})=>request(app).post('/adoptionSystem/v1/appointment/createAppointment').set(auth(token)).send({pet:petId,date:at,...extra});
test('ten concurrent requests for one pet and slot create exactly one appointment',async()=>{
    const results=await Promise.all(Array.from({length:10},(_,i)=>book(i%2?aliceToken:bobToken)));
    assert.equal(results.filter(result=>result.status===201).length,1);
    assert.equal(results.filter(result=>result.status===409).length,9);
    assert.equal(await Appointment.countDocuments({status:'CREATED'}),1);
});
test('a user cannot occupy two pet slots at once; cancellation releases availability',async()=>{
    const first=await book(aliceToken);
    assert.equal(first.status,201);
    assert.equal((await book(aliceToken,otherPet.id)).status,409);
    assert.equal((await request(app).delete('/adoptionSystem/v1/appointment/appointmentCancelled/'+first.body.appointment._id).set(auth(aliceToken))).status,200);
    assert.equal((await book(aliceToken,otherPet.id)).status,201);
});
test('reschedule collisions roll back the original time and cancelled appointments stay terminal',async()=>{
    const first=await book(aliceToken);
    const later=new Date(new Date(date).getTime()+1800000).toISOString();
    const second=await book(bobToken,pet.id,later);
    const update=await request(app).patch('/adoptionSystem/v1/appointment/updateDate/'+second.body.appointment._id).set(auth(bobToken)).send({newDate:date});
    assert.equal(update.status,409);
    assert.equal((await Appointment.findById(second.body.appointment._id)).date.toISOString(),later);
    await request(app).delete('/adoptionSystem/v1/appointment/appointmentCancelled/'+first.body.appointment._id).set(auth(aliceToken));
    assert.equal((await request(app).patch('/adoptionSystem/v1/appointment/updateDate/'+first.body.appointment._id).set(auth(aliceToken)).send({newDate:later})).status,404);
});
test('a user cannot spoof owner, read or cancel another appointment or modify another pet',async()=>{
    assert.equal((await book(aliceToken,pet.id,date,{user:bob.id})).status,403);
    const first=await book(aliceToken);
    assert.equal((await request(app).get('/adoptionSystem/v1/appointment/'+alice.id).set(auth(bobToken))).status,403);
    assert.equal((await request(app).delete('/adoptionSystem/v1/appointment/appointmentCancelled/'+first.body.appointment._id).set(auth(bobToken))).status,404);
    assert.equal((await request(app).put('/adoptionSystem/v1/pet/updatePet/'+pet.id).set(auth(bobToken)).send({name:'Changed'})).status,404);
    assert.equal((await request(app).get('/adoptionSystem/v1/user/findUser/'+alice.id).set(auth(bobToken))).status,403);
    assert.equal((await request(app).get('/adoptionSystem/v1/user/').set(auth(bobToken))).status,403);
});
test('pet deactivation cancels appointments atomically and blocks new reservations',async()=>{
    await book(bobToken);
    assert.equal((await request(app).delete('/adoptionSystem/v1/pet/deletePet/'+pet.id).set(auth(aliceToken))).status,200);
    assert.equal(await Appointment.countDocuments({pet:pet.id,status:'CREATED'}),0);
    assert.equal((await book(bobToken)).status,404);
    assert.equal((await Pet.findById(pet.id)).status,false);
});
test('calendar, zone, slot and pagination validation reject invalid input',async()=>{
    for(const at of ['bad','2040-02-30T12:00:00Z','2040-01-01T12:15:00Z','2040-01-01T12:00:00','2000-01-01T12:00:00Z']){
        assert.equal((await book(aliceToken,pet.id,at)).status,400);
    }
    assert.equal((await request(app).get('/adoptionSystem/v1/appointment/'+alice.id).set(auth(aliceToken)).query({limite:'0'})).status,400);
    const offset=date.replace('Z','+00:00');
    assert.equal((await book(aliceToken,pet.id,offset)).status,201);
    assert.equal((await book(bobToken,pet.id,date)).status,409);
});
test('catalog exposes no keeper contact; invalid tokens and role escalation are rejected',async()=>{
    const catalog=await request(app).get('/adoptionSystem/v1/pet/').set(auth(bobToken));
    assert.equal(catalog.status,200);
    assert.equal(catalog.body.pets[0].keeper,undefined);
    assert.equal((await book('invalid')).status,401);
    const update=await request(app).put('/adoptionSystem/v1/user/updateUser/'+alice.id).set(auth(aliceToken)).send({name:'Updated',role:'ADMIN_ROLE',password:'plain-text'});
    assert.equal(update.status,200);
    assert.equal((await User.findById(alice.id)).role,'USER_ROLE');
    assert.equal(update.body.user.password,undefined);
    assert.equal((await request(app).get('/adoptionSystem/v1/user/').set(auth(adminToken))).status,200);
});

test('profile image upload creates its destination on a clean checkout',async()=>{
    const folder=resolve('public/uploads/profile-pictures');
    const existed=await access(folder).then(()=>true,()=>false);
    const prefix='regression-'+randomUUID();
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ9sAAAAASUVORK5CYII=','base64');
    try{
        const response=await request(app).patch('/adoptionSystem/v1/user/updateProfilePicture/'+alice.id).set(auth(aliceToken)).attach('profilePicture',png,{filename:prefix+'.png',contentType:'image/png'});
        assert.equal(response.status,200);
        const stored=await User.findById(alice.id);
        assert.match(stored.profilePicture,new RegExp('^'+prefix));
        assert.deepEqual(await readFile(resolve(folder,stored.profilePicture)),png);
    }finally{
        for(const name of await readdir(folder).catch(()=>[]))if(name.startsWith(prefix))await unlink(resolve(folder,name));
        if(!existed)await rmdir(folder).catch(error=>{if(!['ENOENT','ENOTEMPTY'].includes(error.code))throw error;});
    }
});

test('two accounts uploading the same filename in one millisecond keep separate image files',async context=>{
    const folder=resolve('public/uploads/profile-pictures');
    const existed=await access(folder).then(()=>true,()=>false);
    const prefix='regression-'+randomUUID();
    const first=Buffer.from('synthetic first image');const second=Buffer.from('synthetic second image');
    context.mock.method(Date,'now',()=>1795824000000);
    try{
        const responses=await Promise.all([[alice,aliceToken,first],[bob,bobToken,second]].map(([user,token,bytes])=>request(app).patch('/adoptionSystem/v1/user/updateProfilePicture/'+user.id).set(auth(token)).attach('profilePicture',bytes,{filename:prefix+'.png',contentType:'image/png'})));
        assert.deepEqual(responses.map(response=>response.status),[200,200]);
        const [storedAlice,storedBob]=await Promise.all([User.findById(alice.id),User.findById(bob.id)]);
        assert.notEqual(storedAlice.profilePicture,storedBob.profilePicture);
        assert.deepEqual(await readFile(resolve(folder,storedAlice.profilePicture)),first);
        assert.deepEqual(await readFile(resolve(folder,storedBob.profilePicture)),second);
    }finally{
        for(const name of await readdir(folder).catch(()=>[]))if(name.startsWith(prefix))await unlink(resolve(folder,name));
        if(!existed)await rmdir(folder).catch(error=>{if(!['ENOENT','ENOTEMPTY'].includes(error.code))throw error;});
    }
});
