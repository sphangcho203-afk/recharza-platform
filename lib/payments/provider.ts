export type PaymentSessionInput = {
  orderId: string;
  amountInPaise: number;
  currency: "INR";
  customerEmail: string;
};

export type PaymentSession = {
  provider: string;
  sessionId: string;
  status: "development_only";
  checkoutUrl: null;
  message: string;
};

export interface PaymentProvider {
  createSession(input: PaymentSessionInput): Promise<PaymentSession>;
}

class DevelopmentPaymentProvider implements PaymentProvider {
  async createSession(input: PaymentSessionInput): Promise<PaymentSession> {
    return {
      provider: "development-mock",
      sessionId: `dev_${input.orderId}`,
      status: "development_only",
      checkoutUrl: null,
      message:
        "No payment was charged. Connect a verified payment provider before enabling real checkout.",
    };
  }
}

export const paymentProvider: PaymentProvider = new DevelopmentPaymentProvider();
