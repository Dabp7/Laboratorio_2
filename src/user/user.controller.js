import {hash,verify} from 'argon2';
import User from './user.model.js';
import {fail,errorResponse,page} from '../helpers/http.js';
import {basename,resolve} from 'node:path';
import {unlink} from 'node:fs/promises';
export const getUserById=async(req,res)=>{
    try{const user=await User.findById(req.params.uid);if(!user)fail(404,'Account not found');return res.json({success:true,user});}catch(error){return errorResponse(res,error);}
};
export const getUsers=async(req,res)=>{
    try{const {limit,offset}=page(req.query);const query={status:true};const [total,users]=await Promise.all([User.countDocuments(query),User.find(query).sort({_id:1}).skip(offset).limit(limit)]);return res.json({success:true,total,users});}catch(error){return errorResponse(res,error);}
};
export const deleteUser=async(req,res)=>{
    try{const user=await User.findByIdAndUpdate(req.params.uid,{$set:{status:false}},{new:true});if(!user)fail(404,'Account not found');return res.json({success:true,user});}catch(error){return errorResponse(res,error);}
};
export const updatePassword=async(req,res)=>{
    try{
        if(req.params.uid!==req.usuario.id)fail(403,'Only the account owner can change the password');
        const {oldPassword,newPassword}=req.body;
        if(typeof oldPassword!=='string'||typeof newPassword!=='string'||newPassword.length<12||newPassword.length>128)fail(400,'Provide the current password and a new password of 12 to 128 characters');
        const user=await User.findById(req.params.uid);
        if(!user||!await verify(user.password,oldPassword))fail(401,'Invalid current password');
        if(await verify(user.password,newPassword))fail(400,'New password must differ');
        user.password=await hash(newPassword);await user.save();
        return res.json({success:true,message:'Password changed'});
    }catch(error){return errorResponse(res,error);}
};
export const updateUser=async(req,res)=>{
    try{
        const data={};
        for(const field of ['name','surname','username','email','phone'])if(req.body[field]!==undefined){if(typeof req.body[field]!=='string'||!req.body[field].trim())fail(400,'Invalid '+field);data[field]=req.body[field].trim();}
        if(!Object.keys(data).length)fail(400,'No editable profile fields');
        const user=await User.findByIdAndUpdate(req.params.uid,{$set:data},{new:true,runValidators:true});if(!user)fail(404,'Account not found');return res.json({success:true,user});
    }catch(error){return errorResponse(res,error);}
};
export const updateProfilePicture=async(req,res)=>{
    try{
        if(!req.file)fail(400,'Profile image required');
        const user=await User.findById(req.params.uid);if(!user)fail(404,'Account not found');
        const old=user.profilePicture;user.profilePicture=req.file.filename;await user.save();
        if(old)await unlink(resolve('public/uploads/profile-pictures',basename(old))).catch(()=>{});
        return res.json({success:true,user});
    }catch(error){return errorResponse(res,error);}
};
