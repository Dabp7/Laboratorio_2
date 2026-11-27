import 'dotenv/config';
import mongoose from 'mongoose';
import {hash} from 'argon2';
import User from '../src/user/user.model.js';
import Pet from '../src/pet/pet.model.js';
import Appointment from '../src/appointment/appointment.model.js';
if(!process.env.URI_MONGO||!new URL(process.env.URI_MONGO).pathname.endsWith('/adoption_demo'))throw new Error('Seed only accepts adoption_demo');
await mongoose.connect(process.env.URI_MONGO);
try{
    await Appointment.init();
    const password=await hash('Demo-password-123!');
    for(const [name,role] of [['admin','ADMIN_ROLE'],['alice','USER_ROLE'],['bob','USER_ROLE']])await User.updateOne({username:name},{$setOnInsert:{name:'Demo',surname:name,username:name,email:name+'@example.test',password,phone:'00000000',role}},{upsert:true});
    const owner=await User.findOne({username:'alice'});
    await Pet.updateOne({name:'Demo Luna',keeper:owner.id},{$setOnInsert:{name:'Demo Luna',description:'Synthetic adoption profile',age:3,type:'DOG',keeper:owner.id}},{upsert:true});
    console.log('Synthetic demo ready: admin/alice/bob@example.test / Demo-password-123!');
}finally{await mongoose.disconnect();}
