import mongoose from 'mongoose';
export function dbConnection(){if(!process.env.URI_MONGO)throw new Error('URI_MONGO required');return mongoose.connect(process.env.URI_MONGO,{serverSelectionTimeoutMS:5000});}
