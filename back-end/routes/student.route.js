import express from "express";
const router = express.Router();
import {
  insertStudent,
  getAll,
  deleteOne,
  saveScore,
} from "../controllers/student.controller.js";

router.post("/", insertStudent);
router.get("/", getAll);
router.delete("/:id", deleteOne);
router.post("/scores", saveScore);

export default router;
