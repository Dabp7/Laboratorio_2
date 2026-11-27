export const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
export function errorResponse(res,error){
    const status=error.status??(error.code===11000?409:['CastError','ValidationError'].includes(error.name)?400:500);
    return res.status(status).json({success:false,message:status===500?'Internal server error':error.code===11000?'Appointment slot or unique value already taken':error.message});
}
export function page(query){
    const number=(value,fallback,min,max)=>{
        if(value===undefined)return fallback;
        if(typeof value!=='string'||!/^\d+$/.test(value))fail(400,'Invalid pagination');
        const parsed=Number(value);if(!Number.isSafeInteger(parsed)||parsed<min||parsed>max)fail(400,'Pagination out of range');return parsed;
    };
    return {limit:number(query.limite,20,1,100),offset:number(query.desde,0,0,1000000)};
}
