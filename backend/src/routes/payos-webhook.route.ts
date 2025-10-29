import { Router } from "express";
import { verifyWebhook } from "../services/payos";
import CarrierDebt from "../models/CarrierDebt";
import CommissionPayment from "../models/CommissionPayment";

const router = Router();

// Quick test endpoint to verify PayOS keys work and returns a QR/link
router.get("/test", async (_req, res) => {
  try {
    const { createPaymentLink } = require("../services/payos");
    const testOrder = Date.now();
    const created = await createPaymentLink({
      orderCode: testOrder,
      amount: 1000,
      description: `test ${testOrder}`,
    });
    res.json({ ok: true, created });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.response?.data || e?.message || e });
  }
});

// PayOS webhook callback
router.post("/webhook", async (req: any, res) => {
  try {
    const signature = req.headers["x-payos-signature"] as string;
    const body = req.body;

    const ok = verifyWebhook(body, signature);
    if (!ok) return res.status(400).json({ message: "Invalid signature" });

    const { data } = body || {};
    // Expecting we sent description & orderCode into PayOS
    const orderCode: string = data?.orderCode || data?.order_code || "";
    const status: string = data?.status || data?.code || "";
    const paidSuccess = String(status).toUpperCase().includes("PAID") || String(status).toUpperCase().includes("SUCCESS");

    // Find payment by payosCode or description reference
    const payment = await CommissionPayment.findOne({ $or: [
      { payosCode: data?.paymentLinkId || data?.id },
      { orderCode: orderCode }
    ]});

    if (!payment) return res.status(200).json({ message: "No payment matched" });

    if (paidSuccess) {
      payment.status = "PAID" as any;
      payment.paidAt = new Date();
      payment.metadata = {
        transactionDate: new Date(),
        amount: payment.amount as any,
        description: payment.description,
        reference: orderCode,
      } as any;
      await payment.save();

      await CarrierDebt.findOneAndUpdate(
        { _id: payment.debtId },
        { $set: { debtStatus: "PAID", paidAt: new Date() } }
      );
    }

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("PayOS webhook error:", err?.message || err);
    return res.status(500).json({ message: "Webhook error" });
  }
});

export default router;


