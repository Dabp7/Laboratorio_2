import { config } from "dotenv"
import { initServer } from "./configs/server.js"

config()
initServer().catch(() => { console.error('Startup failed: check local configuration and isolated database'); process.exitCode = 1; })
