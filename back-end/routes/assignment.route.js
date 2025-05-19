import express from "express";
import {
  createOne,
  deleteOneById,
  getAll,
  getManyByProgramCourse,
} from "../controllers/assignment.controller.js";
const router = express.Router();

router.get("/", getAll);
router.post("/", createOne);
router.delete("/:assignment_id", deleteOneById);
router.get("/:program_course_id", getManyByProgramCourse);

export default router;
