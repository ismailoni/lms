import { Router } from "express";
import express from "express";
import { 
  createTransaction, 
  listTransaction, 
  createStripePaymentIntent,
} from "../controllers/transactionController";

const router = Router();

// Regular routes (with JSON parsing)
router.get("/", listTransaction);
router.post("/", createTransaction);
router.post("/stripe/payment-intent", createStripePaymentIntent);



export default router;