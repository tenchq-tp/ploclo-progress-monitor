import express from "express";
import { getAll, insertOne } from "../controllers/university.controller.js";
const router = express.Router();

router.get("/", getAll);
router.post("/", insertOne);

export default router;
