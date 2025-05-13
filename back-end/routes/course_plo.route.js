import express from "express";
const router = express.Router();
import {
  getManyByProgram,
  createOne,
  updateOne,
} from "../controllers/course_plo.controller.js";

router.get("/", getManyByProgram);
router.post("/", createOne);
router.patch("/", updateOne);

export default router;
