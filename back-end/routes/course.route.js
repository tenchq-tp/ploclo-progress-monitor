import express from "express";
const router = express.Router();
import {
  getAll,
  createOne,
  updateOneById,
  deleteOneById,
} from "../controllers/course.controller.js";

router.get("/", getAll);
router.post("/", createOne);
router.put("/:course_id", updateOneById);
router.delete("/:course_id", deleteOneById);

export default router;
