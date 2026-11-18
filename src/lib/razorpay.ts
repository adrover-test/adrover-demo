export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  order_id?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    callback: (response: { error: { description?: string } }) => void,
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const checkoutScript = "https://checkout.razorpay.com/v1/checkout.js";
const keyId = (import.meta.env.VITE_RAZORPAY_KEY_ID ?? "").trim();

export const razorpayConfigured = keyId.length > 0;

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = checkoutScript;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Razorpay could not be loaded. Check your connection."));
    document.body.appendChild(script);
  });
}

export type PaymentRequest = {
  amountInr: number;
  description: string;
  customer: { name: string; email: string; contact: string };
  reference: string;
};

export type PaymentResult =
  { status: "paid"; paymentId: string } | { status: "cancelled" };

export async function checkoutOrder(order: {
  orderId: string; keyId: string; amount: number; currency: string;
}, onCheckoutChange?: (open: boolean) => void): Promise<RazorpaySuccess | null> {
  if (!order.orderId || !order.keyId || order.currency !== "INR") {
    throw new Error("A valid backend payment order is required. No payment was started.");
  }
  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Razorpay could not be loaded.");
  onCheckoutChange?.(true);
  try {
    return await new Promise<RazorpaySuccess | null>((resolve, reject) => {
      let paymentError: Error | undefined;
      const checkout = new Razorpay({
        key: order.keyId, order_id: order.orderId, amount: Math.round(order.amount * 100),
        currency: "INR", name: "Adrover", description: "Advertisement campaign",
        handler: resolve, modal: { ondismiss: () => paymentError ? reject(paymentError) : resolve(null) },
      });
      checkout.on("payment.failed", (response) => {
        paymentError = new Error(response.error.description ?? "Payment failed. Check payment status before retrying.");
        if (!onCheckoutChange) reject(paymentError);
      });
      checkout.open();
    });
  } finally {
    onCheckoutChange?.(false);
  }
}

export async function payWithRazorpay(
  request: PaymentRequest,
): Promise<PaymentResult> {
  if (!razorpayConfigured) {
    await new Promise((resolve) => setTimeout(resolve, 1800));
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 14);
    return { status: "paid", paymentId: `pay_DEMO${suffix}` };
  }
  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Razorpay could not be loaded.");

  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      key: keyId,
      amount: Math.round(request.amountInr * 100),
      currency: "INR",
      name: "Adrover",
      description: request.description,
      prefill: request.customer,
      notes: { reference: request.reference },
      theme: { color: "#087a45" },
      handler: (response) =>
        resolve({ status: "paid", paymentId: response.razorpay_payment_id }),
      modal: { ondismiss: () => resolve({ status: "cancelled" }) },
    });
    checkout.on("payment.failed", (response) =>
      reject(
        new Error(
          response.error.description ??
            "The payment failed. You have not been charged; please try again.",
        ),
      ),
    );
    checkout.open();
  });
}
