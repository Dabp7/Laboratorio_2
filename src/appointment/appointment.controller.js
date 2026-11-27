import mongoose from 'mongoose';
import Pet from '../pet/pet.model.js';
import User from '../user/user.model.js';
import Appointment from './appointment.model.js';
import {fail,errorResponse,page} from '../helpers/http.js';
function slot(value) {
    if(typeof value!=='string'||value.length>40||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))fail(400,'Use an ISO timestamp with Z or UTC offset');
    const [year,month,day]=value.slice(0,10).split('-').map(Number);
    const calendar=new Date(Date.UTC(year,month-1,day));
    if(calendar.getUTCFullYear()!==year||calendar.getUTCMonth()!==month-1||calendar.getUTCDate()!==day)fail(400,'Invalid calendar date');
    const date=new Date(value);
    if(!Number.isFinite(date.getTime())||date.getTime()<=Date.now()||date.getUTCMinutes()%30!==0||date.getUTCSeconds()!==0||date.getUTCMilliseconds()!==0)fail(400,'Appointments use future 30-minute UTC slots');
    return date;
}
const ownerQuery=(req)=>req.usuario.role==='ADMIN_ROLE'?{}:{user:req.usuario._id};
export const saveAppointment=async(req,res)=>{
    try{
        const date=slot(req.body.date);
        if(!mongoose.isValidObjectId(req.body.pet))fail(400,'Invalid pet');
        const userId=req.body.user??req.usuario.id;
        if(req.usuario.role!=='ADMIN_ROLE'&&String(userId)!==req.usuario.id)fail(403,'Cannot book for another user');
        if(!mongoose.isValidObjectId(userId))fail(400,'Invalid user');
        if(!await User.exists({_id:userId,status:true}))fail(404,'User not found');
        let appointment;
        await mongoose.connection.transaction(async session=>{
            const pet=await Pet.findOneAndUpdate({_id:req.body.pet,status:true},{$inc:{bookingVersion:1}},{new:true,session});
            if(!pet)fail(404,'Pet unavailable');
            [appointment]=await Appointment.create([{date,pet:pet._id,user:userId,status:'CREATED'}],{session});
        });
        return res.status(201).json({success:true,appointment});
    }catch(error){return errorResponse(res,error);}
};
export const getAppointment=async(req,res)=>{
    try{
        if(req.usuario.role!=='ADMIN_ROLE'&&req.params.uid!==req.usuario.id)fail(403,'Cannot read another account');
        if(!mongoose.isValidObjectId(req.params.uid))fail(400,'Invalid user');
        const {limit,offset}=page(req.query);
        const query={user:req.params.uid,status:{$in:['CREATED','ACCEPTED']}};
        const [total,appointment]=await Promise.all([Appointment.countDocuments(query),Appointment.find(query).sort({date:1,_id:1}).skip(offset).limit(limit)]);
        return res.json({success:true,total,appointment});
    }catch(error){return errorResponse(res,error);}
};
export const deleteAppointment=async(req,res)=>{
    try{
        const appointment=await Appointment.findOneAndUpdate({_id:req.params.uid,...ownerQuery(req),status:{$in:['CREATED','ACCEPTED']}},{$set:{status:'CANCELLED'}},{new:true});
        if(!appointment)fail(404,'Active appointment not found');
        return res.json({success:true,message:'Appointment cancelled',appointment});
    }catch(error){return errorResponse(res,error);}
};
export const updateDateAppointment=async(req,res)=>{
    try{
        const date=slot(req.body.newDate);
        let dateUpdate;
        await mongoose.connection.transaction(async session=>{
            const appointment=await Appointment.findOne({_id:req.params.uid,...ownerQuery(req),status:{$in:['CREATED','ACCEPTED']}}).session(session);
            if(!appointment)fail(404,'Active appointment not found');
            const pet=await Pet.findOneAndUpdate({_id:appointment.pet,status:true},{$inc:{bookingVersion:1}},{new:true,session});
            if(!pet)fail(409,'Pet unavailable');
            appointment.date=date;dateUpdate=await appointment.save({session});
        });
        return res.json({success:true,dateUpdate});
    }catch(error){return errorResponse(res,error);}
};
