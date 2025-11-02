import { Router } from "express";
import { verifyWebhook } from "../services/payos";
import CarrierDebt from "../models/CarrierDebt";
import CommissionPayment from "../models/CommissionPayment";

const router = Router();



// PayOS webhook callback
router.post("/webhook", async (req: any, res) => {
  try {
    // PayOS có thể gửi signature trong header hoặc body
    const signature = req.headers["x-payos-signature"] as string || req.body?.signature || "";
    const body = req.body;

    console.log("📥 PayOS Webhook received:", JSON.stringify(body, null, 2));
    console.log("📥 PayOS Signature (header):", req.headers["x-payos-signature"]);
    console.log("📥 PayOS Signature (body):", body?.signature);

    const ok = verifyWebhook(body, signature);
    if (!ok) {
      console.error("❌ Invalid webhook signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const { data } = body || {};
    // PayOS trả về orderCode là số nguyên (numericCode đã gửi khi tạo payment)
    const payosOrderCode: number = data?.orderCode || data?.order_code || null;
    const paymentLinkId: string = data?.paymentLinkId || data?.id || data?.paymentLinkId || "";
    
    // PayOS trả về code và desc để báo trạng thái thanh toán
    // code: "00" = thành công, desc: "success" = mô tả thành công
    const code: string = body?.code || data?.code || "";
    const desc: string = body?.desc || data?.desc || "";
    const status: string = data?.status || "";
    
    console.log("🔍 Webhook data:", {
      payosOrderCode,
      paymentLinkId,
      code,
      desc,
      status,
      fullData: data
    });

    // PayOS trả về code="00" và desc="success" khi thanh toán thành công
    const paidSuccess = code === "00" || 
                        String(desc).toLowerCase().includes("success") ||
                        String(status).toUpperCase().includes("PAID") || 
                        String(status).toUpperCase().includes("SUCCESS");

    // Tìm payment bằng payosOrderCode (numericCode) hoặc payosCode (paymentLinkId)
    const searchQuery: any = {};
    if (payosOrderCode) {
      searchQuery.payosOrderCode = Number(payosOrderCode);
    }
    if (paymentLinkId) {
      searchQuery.payosCode = paymentLinkId;
    }

    // Nếu có cả hai, dùng $or, nếu không thì dùng từng điều kiện
    const findQuery = payosOrderCode && paymentLinkId 
      ? { $or: [{ payosOrderCode: Number(payosOrderCode) }, { payosCode: paymentLinkId }] }
      : payosOrderCode 
        ? { payosOrderCode: Number(payosOrderCode) }
        : paymentLinkId 
          ? { payosCode: paymentLinkId }
          : null;

    if (!findQuery) {
      console.error("❌ No search criteria available:", { payosOrderCode, paymentLinkId });
      return res.status(400).json({ message: "Missing orderCode or paymentLinkId in webhook data" });
    }

    console.log("🔍 Searching payment with query:", findQuery);
    const payment = await CommissionPayment.findOne(findQuery);

    if (!payment) {
      console.error("❌ Payment not found with query:", findQuery);
      // Log tất cả payments gần đây để debug
      const recentPayments = await CommissionPayment.find({ status: "PENDING" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("payosOrderCode payosCode orderCode createdAt");
      console.log("📋 Recent pending payments:", recentPayments);
      return res.status(200).json({ message: "No payment matched", searchQuery: findQuery });
    }

    console.log("✅ Payment found:", {
      paymentId: String(payment._id),
      orderCode: payment.orderCode,
      payosOrderCode: payment.payosOrderCode,
      currentStatus: payment.status
    });

    if (paidSuccess) {
      payment.status = "PAID" as any;
      payment.paidAt = new Date();
      payment.metadata = {
        transactionDate: new Date(),
        amount: payment.amount as any,
        description: payment.description,
        reference: String(payosOrderCode || paymentLinkId),
      } as any;
      await payment.save();
      console.log("✅ Payment status updated to PAID");

      const debtUpdate = await CarrierDebt.findOneAndUpdate(
        { _id: payment.debtId },
        { $set: { debtStatus: "PAID", paidAt: new Date() } },
        { new: true }
      );
      console.log("✅ CarrierDebt updated:", debtUpdate ? "SUCCESS" : "NOT FOUND");
    } else {
      console.log("⚠️ Payment not marked as paid. Code:", code, "Desc:", desc, "Status:", status);
    }

    return res.json({ ok: true, paymentId: String(payment._id), status: payment.status });
  } catch (err: any) {
    console.error("❌ PayOS webhook error:", err?.message || err);
    console.error("❌ Stack trace:", err?.stack);
    return res.status(500).json({ message: "Webhook error", error: err?.message });
  }
});

export default router;


