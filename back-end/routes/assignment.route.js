import express from "express";
import {
  assignStudent,
  createOne,
  deleteOneById,
  getAll,
  getManyByProgramCourse,
  getManyWithScore,
  updateScore,
} from "../controllers/assignment.controller.js";
const router = express.Router();

router.get("/", getAll);
router.post("/", createOne);
router.delete("/:assignment_id", deleteOneById);
router.get("/:program_course_id", getManyByProgramCourse);
router.post("/assign", assignStudent);
router.get("/score/:assignment_id", getManyWithScore);
router.post("/score", updateScore);

export default router;
