import mongoose from 'mongoose';
import { config } from "dotenv"
import { initServer } from "./configs/server.js"

config()
initServer().catch(async () => { await mongoose.disconnect(); console.error('Startup failed: check local configuration and isolated database'); process.exitCode = 1; })
