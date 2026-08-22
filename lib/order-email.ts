import { formatInr } from "@/lib/mobile-legends";
import { sendTransactionalEmail } from "@/lib/transactional-email";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

type OrderEmailInput = {
  orderId: string;
  databaseOrderId: string;
  customerId: string;
  email: string;
  gameLabel: string;
  packageName: string;
  playerLabel: string;
  amountInPaise: number;
  occurredAt: Date;
};

export function sendOrderCompletedEmail(input: OrderEmailInput) {
  return sendTransactionalEmail({
    kind: "ORDER_COMPLETED",
    to: input.email,
    subject: `Order ${input.orderId} completed`,
    eyebrow: "Order completed",
    title: "Your top-up is complete.",
    message:
      "Your order has been completed successfully. You can view the details in your Recharza account.",
    details: [
      { label: "Order", value: input.orderId },
      { label: "Game", value: input.gameLabel },
      { label: "Player", value: input.playerLabel },
      { label: "Package", value: input.packageName },
      { label: "Amount", value: formatInr(input.amountInPaise) },
      { label: "Completed", value: formatTimestamp(input.occurredAt) },
    ],
    action: {
      label: "Open order tracking",
      url: `${appUrl()}/orders/${encodeURIComponent(input.orderId)}`,
    },
    customerId: input.customerId,
    orderId: input.databaseOrderId,
  });
}

export function sendOrderFailedEmail(
  input: OrderEmailInput & { reason: string },
) {
  return sendTransactionalEmail({
    kind: "ORDER_FAILED",
    to: input.email,
    subject: `Order ${input.orderId} needs attention`,
    eyebrow: "Order failed",
    title: "The order was not completed.",
    message:
      "Your order could not be completed. Please review the order status in your account for more details.",
    details: [
      { label: "Order", value: input.orderId },
      { label: "Game", value: input.gameLabel },
      { label: "Player", value: input.playerLabel },
      { label: "Package", value: input.packageName },
      { label: "Amount", value: formatInr(input.amountInPaise) },
      { label: "Reason", value: input.reason },
      { label: "Failed", value: formatTimestamp(input.occurredAt) },
    ],
    action: {
      label: "Review order status",
      url: `${appUrl()}/orders/${encodeURIComponent(input.orderId)}`,
    },
    customerId: input.customerId,
    orderId: input.databaseOrderId,
  });
}
