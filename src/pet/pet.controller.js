import mongoose from 'mongoose';
import Pet from './pet.model.js';
import Appointment from '../appointment/appointment.model.js';
import {fail,errorResponse,page} from '../helpers/http.js';
const allowed=(req)=>req.usuario.role==='ADMIN_ROLE'?{}:{keeper:req.usuario._id};
const publicFields='name description age type status';
function fields(body,partial=false){
    const data={};
    for(const key of ['name','description','type']){
        if(body[key]!==undefined){if(typeof body[key]!=='string'||!body[key].trim()||body[key].length>500)fail(400,'Invalid '+key);data[key]=body[key].trim();}
        else if(!partial)fail(400,key+' required');
    }
    if(body.age!==undefined||!partial){if(!Number.isInteger(body.age)||body.age<0||body.age>100)fail(400,'Invalid age');data.age=body.age;}
    if(!Object.keys(data).length)fail(400,'No editable fields');return data;
}
export const savePet=async(req,res)=>{
    try{const pet=await Pet.create({...fields(req.body),keeper:req.usuario._id});return res.status(201).json({success:true,pet});}
    catch(error){return errorResponse(res,error);}
};
export const updatePet=async(req,res)=>{
    try{const pet=await Pet.findOneAndUpdate({_id:req.params.id,...allowed(req),status:true},{$set:fields(req.body,true)},{new:true,runValidators:true});if(!pet)fail(404,'Owned pet not found');return res.json({success:true,pet});}
    catch(error){return errorResponse(res,error);}
};
export const getPets=async(req,res)=>{
    try{const {limit,offset}=page(req.query);const query={status:true};const [total,pets]=await Promise.all([Pet.countDocuments(query),Pet.find(query).select(publicFields).sort({name:1,_id:1}).skip(offset).limit(limit)]);return res.json({success:true,total,pets});}
    catch(error){return errorResponse(res,error);}
};
export const searchPet=async(req,res)=>{
    try{const pet=await Pet.findOne({_id:req.params.id,status:true}).select(publicFields);if(!pet)fail(404,'Pet not found');return res.json({success:true,pet});}
    catch(error){return errorResponse(res,error);}
};
export const deletePet=async(req,res)=>{
    try{
        await mongoose.connection.transaction(async session=>{
            const pet=await Pet.findOneAndUpdate({_id:req.params.id,...allowed(req),status:true},{$set:{status:false},$inc:{bookingVersion:1}},{new:true,session});
            if(!pet)fail(404,'Owned pet not found');
            await Appointment.updateMany({pet:pet._id,status:{$in:['CREATED','ACCEPTED']}},{$set:{status:'CANCELLED'}},{session});
        });
        return res.json({success:true,message:'Pet deactivated and active appointments cancelled'});
    }catch(error){return errorResponse(res,error);}
};
