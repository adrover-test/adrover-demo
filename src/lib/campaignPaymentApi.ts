import { send } from "./advertisementApi";
import { checkoutOrder } from "./razorpay";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function payForCampaign(
  id: string,
  amount: number,
  onCheckoutChange?: (open: boolean) => void,
): Promise<"completed" | "processing" | "cancelled"> {
  const order = await send("/api/Payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      advertisementId: id,
      amount,
      description: "Advertisement registration",
    }),
  });
  if (
    !record(order) ||
    typeof order.orderId !== "string" ||
    typeof order.keyId !== "string" ||
    typeof order.amount !== "number" ||
    typeof order.currency !== "string" ||
    typeof order.status !== "string"
  ) {
    throw new Error(
      "We could not prepare checkout. Check payment status before retrying.",
    );
  }
  if (order.status === "Completed") return "completed";
  if (order.status === "Processing") return "processing";
  if (order.status !== "Pending")
    throw new Error(
      `Payment status is ${order.status}. Contact support before paying again.`,
    );
  const result = await checkoutOrder(
    {
      orderId: order.orderId,
      keyId: order.keyId,
      amount: order.amount,
      currency: order.currency,
    },
    onCheckoutChange,
  );
  if (!result) return "cancelled";
  if (
    !result.razorpay_order_id ||
    !result.razorpay_signature ||
    !result.razorpay_payment_id ||
    result.razorpay_order_id !== order.orderId
  ) {
    throw new Error(
      "Checkout returned incomplete payment details. Check payment status; do not start a separate payment.",
    );
  }
  const payment = await send("/api/Payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: result.razorpay_order_id,
      paymentId: result.razorpay_payment_id,
      signature: result.razorpay_signature,
    }),
  });
  if (!record(payment) || typeof payment.status !== "string")
    throw new Error(
      "We could not confirm your payment. Check its status before retrying.",
    );
  if (payment.status === "Completed") return "completed";
  if (payment.status === "Processing") return "processing";
  throw new Error(
    `Payment status is ${payment.status}. Check status before retrying.`,
  );
}
