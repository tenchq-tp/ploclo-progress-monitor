import express from "express";
import {
  createOne,
  getAll,
  getManyByProgramCourse,
} from "../controllers/assignment.controller.js";
const router = express.Router();

router.get("/", getAll);
router.post("/", createOne);
router.get("/:program_course_id", getManyByProgramCourse);

export default router;
