import { Router } from "express";
import { getAppointment, saveAppointment, deleteAppointment, updateDateAppointment } from "./appointment.controller.js";
import { createAppointmentValidator } from "../middlewares/appointment-validators.js";
import { getUserByIdValidator } from "../middlewares/user-validators.js";

const router = Router();

router.post("/createAppointment", createAppointmentValidator, saveAppointment);

router.get("/:uid", getUserByIdValidator, getAppointment) 

router.delete("/appointmentCancelled/:uid", deleteAppointment)

router.patch("/updateDate/:uid", updateDateAppointment)
    
export default router;