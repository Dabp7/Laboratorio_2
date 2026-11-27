import jwt from 'jsonwebtoken';
import User from '../user/user.model.js';
export async function validateJWT(req,res,next) {
    const header=req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({success:false,message:'Bearer token required'});
    let uid;
    try {({uid}=jwt.verify(header.slice(7),process.env.SECRETORPRIVATEKEY,{algorithms:['HS256']}));}
    catch{return res.status(401).json({success:false,message:'Invalid or expired token'});}
    try {
        const user=await User.findById(uid);
        if(!user || !user.status) return res.status(401).json({success:false,message:'Inactive account'});
        req.usuario=user;next();
    }catch{return res.status(503).json({success:false,message:'Authentication unavailable'});}
}
export function requireAdmin(req,res,next) {
    if(req.usuario.role!=='ADMIN_ROLE')return res.status(403).json({success:false,message:'Administrator required'});
    next();
}
export function ownUser(req,res,next) {
    if(req.usuario.role!=='ADMIN_ROLE' && req.params.uid!==req.usuario.id)return res.status(403).json({success:false,message:'Account is not yours'});
    next();
}
