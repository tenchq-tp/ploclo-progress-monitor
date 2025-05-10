import express from "express";
const router = express.Router();
import {
  getMany,
  createOne,
  updateOne,
} from "../controllers/plo_clo.controller.js";

router.get("/", getMany);
router.post("/", createOne);
router.patch("/", updateOne);

export default router;
