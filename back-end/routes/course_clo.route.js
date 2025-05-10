import express from "express";
import {
  getAll,
  getWeightAll,
  addWeight,
  addCourseClo,
  getManyByFilter,
  updateByFilter,
  deleteByFilter,
  getWeightManyWithFilter,
} from "../controllers/course_clo.controller.js";
const router = express.Router();

router.get("/", getAll);
router.get("/weight", getWeightAll);
router.post("/weight", addWeight);
router.post("/", addCourseClo);
router.get("/filter", getManyByFilter);
router.put("/filter", updateByFilter);
router.delete("/filter", deleteByFilter);
router.get("/weight/filter", getWeightManyWithFilter);

export default router;
