import express from "express";
const router = express.Router();
import { insertStudent } from "../controllers/student.controller.js";

router.post("/insert", insertStudent);

export default router;
