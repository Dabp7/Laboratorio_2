import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {dbConnection} from './mongo.js';
import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/user/user.routes.js';
import petRoutes from '../src/pet/pet.routes.js';
import appointmentRoutes from '../src/appointment/appointment.routes.js';
import Appointment from '../src/appointment/appointment.model.js';
export function createApp(){
    const app=express();
    app.use(express.json({limit:'128kb'}),cors(),helmet());
    app.get('/health',(_req,res)=>res.json({status:'ok'}));
    for(const [name,router] of Object.entries({auth:authRoutes,user:userRoutes,pet:petRoutes,appointment:appointmentRoutes}))app.use('/adoptionSystem/v1/'+name,router);
    app.use((error,_req,res,_next)=>res.status(error.status===400?400:500).json({success:false,message:error.status===400?'Invalid body':'Internal server error'}));
    return app;
}
export async function initServer(){
    if(!process.env.SECRETORPRIVATEKEY||process.env.SECRETORPRIVATEKEY.length<32)throw new Error('Set SECRETORPRIVATEKEY with 32 characters or more');
    await dbConnection();
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));await Appointment.init();
    return createApp().listen(Number(process.env.PORT||3003),'127.0.0.1',()=>console.log('Adoption demo ready'));
}
