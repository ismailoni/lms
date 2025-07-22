import express from 'express';
import { createStripePaymentIntent, createTransaction, listTransaction } from '../controllers/transactionController';

const router = express.Router();

router.post('/', createTransaction)
router.get('/', listTransaction)
router.post('/stripe/payment-intent', createStripePaymentIntent);

export default router;