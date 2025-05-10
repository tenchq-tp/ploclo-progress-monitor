import express from "express";
const router = express.Router();
import {
  getManyByProgram,
  createOne,
  createFromExcel,
} from "../controllers/plo.controller.js";

router.get("/", getManyByProgram);
router.post("/", createOne);
router.post("/excel", createFromExcel);

export default router;
