import express from "express";
import {
  getAll,
  getOneById,
  importScoreFromExcel,
  addStudent,
  getAssignmentClo,
  addAssignment,
  getAllByCourse,
  getScoreOneById,
  updateScoreOne,
  getManyCourseByCourseId,
  addClo,
  deleteOneById,
  removeStudent,
  updateAssignment,
} from "../controllers/assignment.controller.js";
const router = express.Router();

router.get("/:assignment_id", getOneById);
router.get("/", getAll);
router.get("/course", getAllByCourse);
router.get("/clo", getAssignmentClo);
router.get("/score/:id", getScoreOneById);
router.get("/by-course", getManyCourseByCourseId);
router.post("/excel-score", importScoreFromExcel);
router.post("/add-student", addStudent);
router.post("/", addAssignment);
router.post("/score", updateScoreOne);
router.post("/clo", addClo);
router.delete("/:id", deleteOneById);
router.delete("/student", removeStudent);
router.put("/:id", updateAssignment);

export default router;
