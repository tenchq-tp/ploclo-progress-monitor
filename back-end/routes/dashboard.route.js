import express from "express";
const router = express.Router();
import { getStudentCLOReport } from "../controllers/dashboard.controller.js";

router.get("/:student_id/clo-report", getStudentCLOReport);

export default router;
