import express from "express";
const router = express.Router();
import {
  getPloScoresByStudent,
  getCloScoresByStudent,
  getCloAndPloScoresByStudent,
  getAvgPloScoresForAllStudents,
  getCloScoresByStudentAndCourse,
  getAverageCloScoresByCourse,
} from "../controllers/dashboard.controller.js";

router.get("/plo/:student_id", getPloScoresByStudent);
router.get("/clo/:student_id", getCloScoresByStudent);
router.get("/student-score/:student_id", getCloAndPloScoresByStudent);
router.get("/plo-average", getAvgPloScoresForAllStudents);
router.get("/student/:student_id/clo-scores", getCloScoresByStudentAndCourse);
router.get("/clo-average", getAverageCloScoresByCourse);

export default router;
