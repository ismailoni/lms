import { Router } from "express";
import express from "express";
import { 
  createTransaction, 
  listTransaction, 
  createStripePaymentIntent,
  handleStripeWebhook 
} from "../controllers/transactionController";

const router = Router();

// Regular routes (with JSON parsing)
router.get("/", listTransaction);
router.post("/", createTransaction);
router.post("/stripe/payment-intent", createStripePaymentIntent);

// Webhook route (with raw body parsing for Stripe signature verification)
router.post("/stripe/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;