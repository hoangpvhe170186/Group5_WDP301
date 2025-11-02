// Handle both CJS and ESM exports from @payos/node
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PayOSLib = require("@payos/node");
const PayOSCtor = (PayOSLib && (PayOSLib.PayOS || PayOSLib.default || PayOSLib)) as any;
import { config } from "../config";

const payos = new PayOSCtor(
  config.PAYOS_CLIENT_ID,
  config.PAYOS_API_KEY,
  config.PAYOS_CHECKSUM_KEY
);

export type CreatePaymentInput = {
  orderCode: number; // PayOS requires a unique integer
  amount: number; // in VND
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
};

export async function createPaymentLink(input: CreatePaymentInput) {
  const { orderCode, amount, description, returnUrl, cancelUrl, buyerName, buyerEmail, buyerPhone } = input;
  // SDK will sign request internally. Different SDK versions expose different APIs.
  const payload = {
    orderCode,
    amount,
    description,
    returnUrl: returnUrl || "http://localhost:5173/payment-success",
    cancelUrl: cancelUrl || "http://localhost:5173/payment-cancel",
    buyerName,
    buyerEmail,
    buyerPhone,
  };

  const anyPayos = payos as any;
  let res: any;
  if (typeof anyPayos.createPaymentLink === "function") {
    res = await anyPayos.createPaymentLink(payload);
  } else if (anyPayos.paymentLink && typeof anyPayos.paymentLink.createPaymentLink === "function") {
    res = await anyPayos.paymentLink.createPaymentLink(payload);
  } else if (anyPayos.paymentRequests && typeof anyPayos.paymentRequests.createPaymentLink === "function") {
    res = await anyPayos.paymentRequests.createPaymentLink(payload);
  } else if (anyPayos.paymentRequests && typeof anyPayos.paymentRequests.create === "function") {
    res = await anyPayos.paymentRequests.create(payload);
  } else if (typeof anyPayos.createPaymentLinkUrl === "function") {
    res = await anyPayos.createPaymentLinkUrl(payload);
  } else {
    const available = Object.keys(anyPayos || {});
    throw new Error(`PayOS SDK create function not found. Available keys: ${available.join(", ")}`);
  }

  // Normalize common fields
  return {
    paymentLinkId: String(res?.paymentLinkId || res?.id || ""),
    checkoutUrl: res?.checkoutUrl || res?.payUrl || null,
    qrCode: res?.qrCode || res?.qrCodeUrl || null,
    data: res,
  };
}

export function verifyWebhook(body: any, signature: string) {
  // SDK exposes verify function; fallback simple pass-through if not available
  if (typeof (payos as any).verifyPaymentWebhook === "function") {
    return (payos as any).verifyPaymentWebhook(body, signature);
  }
  return true;
}


