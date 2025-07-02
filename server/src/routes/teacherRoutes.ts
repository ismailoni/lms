// server/src/routes/teacherRoutes.ts
import { Router } from "express";
import { getTeacherEarningsFromTable } from "../controllers/teacherController";


const router = Router();

// GET /teachers/:teacherId/earnings/breakdown
router.get("/:teacherId/earnings/breakdown", getTeacherEarningsFromTable);

export default router;
