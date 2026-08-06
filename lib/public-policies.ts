export const PUBLIC_POLICY_KEYS = [
  "terms",
  "privacy",
  "refunds",
  "cookies",
] as const;

export type PublicPolicyKey = (typeof PUBLIC_POLICY_KEYS)[number];

type PublicPolicySection = {
  heading: string;
  paragraphs: string[];
};

export type PublicPolicy = {
  title: string;
  summary: string;
  lastUpdated: string;
  sections: PublicPolicySection[];
};

const supportEmail = "recherzatopup@gmail.com";

export const publicPolicies: Record<PublicPolicyKey, PublicPolicy> = {
  terms: {
    title: "Terms and Conditions",
    summary:
      "The rules for using Recharza accounts, game top-ups, payments, order tracking and support.",
    lastUpdated: "6 August 2026",
    sections: [
      {
        heading: "1. About Recharza",
        paragraphs: [
          "Recharza is an independent digital game top-up platform. Recharza is not the publisher, developer or official representative of the games displayed on the platform unless a specific partnership is stated in writing.",
          "Game names, logos, characters and artwork belong to their respective owners. Their appearance identifies supported products and does not imply sponsorship or endorsement.",
        ],
      },
      {
        heading: "2. Customer eligibility and accounts",
        paragraphs: [
          "You must provide accurate information and use a payment method you are authorised to use. You are responsible for keeping your password, order-access token and device secure.",
          "A customer account is optional for supported guest purchases. Orders may still require an email address so Recharza can send receipts, recovery information and status notices.",
        ],
      },
      {
        heading: "3. Game account and regional details",
        paragraphs: [
          "You must select the correct game, market, player ID, server, zone, Riot ID or other destination information. Digital items delivered to a valid but incorrect account supplied by the customer may not be recoverable.",
          "Recharza will not silently substitute one regional catalogue for another. When a market is unavailable, checkout will remain unavailable until approved fulfilment inventory exists.",
        ],
      },
      {
        heading: "4. Prices and payments",
        paragraphs: [
          "The final amount, currency and any applicable fee are displayed before payment. Currency conversions shown before payment may be time-limited estimates; the payment review screen controls the final amount charged.",
          "An order is not considered paid until Recharza verifies the payment response on its server. A payment-provider screen or bank notification alone does not guarantee successful order creation or fulfilment.",
        ],
      },
      {
        heading: "5. Digital fulfilment",
        paragraphs: [
          "Delivery times are estimates and may be affected by publisher systems, supplier availability, maintenance, account verification or payment review.",
          "Once a digital item has been successfully delivered or redeemed, the transaction is normally final because the item cannot be returned like a physical product.",
        ],
      },
      {
        heading: "6. Prohibited use",
        paragraphs: [
          "You may not use Recharza for fraud, unauthorised payments, chargeback abuse, credential theft, automated attacks, resale that violates game rules, or attempts to access another customer’s account or order.",
          "Recharza may pause, reject or cancel suspicious activity while payment ownership or order information is reviewed.",
        ],
      },
      {
        heading: "7. Liability and service availability",
        paragraphs: [
          "Recharza aims to provide accurate pricing, secure order handling and reliable status information, but uninterrupted availability cannot be guaranteed. Maintenance, payment-provider outages, supplier failures and publisher restrictions may temporarily affect service.",
          "Nothing in these terms removes rights that cannot legally be excluded. Where permitted, Recharza’s responsibility for an affected order is limited to correcting fulfilment, replacing the eligible item or refunding the amount actually received for that order.",
        ],
      },
      {
        heading: "8. Contact and changes",
        paragraphs: [
          `Questions about these terms can be sent to ${supportEmail}. Material updates will be published on this page with a revised date.`,
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    summary:
      "How Recharza collects, uses, protects and retains customer and order information.",
    lastUpdated: "6 August 2026",
    sections: [
      {
        heading: "1. Information we collect",
        paragraphs: [
          "Recharza may collect account information such as name, username, email address and password hash; checkout information such as billing contact and address; game destination information such as player ID, server or region; and order, payment and support records.",
          "We also collect limited technical information required for security and operation, including timestamps, browser or device information, IP-derived security signals, session identifiers and audit events.",
        ],
      },
      {
        heading: "2. How information is used",
        paragraphs: [
          "Information is used to create and secure accounts, validate checkout details, process payments, deliver digital items, recover and track orders, prevent fraud, provide customer support and meet record-keeping obligations.",
          "Recharza does not sell personal information to advertisers.",
        ],
      },
      {
        heading: "3. Service providers",
        paragraphs: [
          "Information may be shared only as necessary with infrastructure, database, email, payment, fraud-prevention and digital-fulfilment providers. Each provider receives the information needed to perform its service rather than unrestricted access to the Recharza platform.",
          "Payment card or UPI credentials are entered into the payment provider’s protected checkout. Recharza does not ask customers to send OTPs, UPI PINs, card PINs or passwords through email, WhatsApp or support messages.",
        ],
      },
      {
        heading: "4. Retention and deletion",
        paragraphs: [
          "Account, order, payment and audit records are retained for as long as needed for fulfilment, support, security, dispute handling and applicable record-keeping requirements. Retention periods may differ by record type.",
          `Customers may request account or privacy assistance at ${supportEmail}. Some transaction records may need to remain where deletion would conflict with security, dispute or record-keeping requirements.`,
        ],
      },
      {
        heading: "5. Security",
        paragraphs: [
          "Recharza uses access controls, encrypted transport, password hashing, protected environment variables, server-side payment verification and private order credentials. No internet service can guarantee absolute security, so customers should use unique passwords and protect their email account and device.",
        ],
      },
      {
        heading: "6. Children and third-party game accounts",
        paragraphs: [
          "Customers should only purchase using accounts and payment methods they are authorised to use. Where parental or guardian consent is required, the customer is responsible for obtaining it before purchase.",
        ],
      },
      {
        heading: "7. Updates",
        paragraphs: [
          "Privacy changes will be published on this page. Material changes may also be communicated through the platform or account email when appropriate.",
        ],
      },
    ],
  },
  refunds: {
    title: "Refund and Cancellation Policy",
    summary:
      "When a Recharza digital order may be cancelled, replaced or refunded.",
    lastUpdated: "6 August 2026",
    sections: [
      {
        heading: "1. Before payment",
        paragraphs: [
          "An unpaid order may be abandoned or allowed to expire. No refund is due when no successful charge was received.",
        ],
      },
      {
        heading: "2. Before fulfilment",
        paragraphs: [
          "A paid order may be eligible for cancellation when fulfilment has not started and the payment can still be safely reversed. Cancellation is not guaranteed once the order has entered supplier processing.",
        ],
      },
      {
        heading: "3. Successfully delivered digital items",
        paragraphs: [
          "Delivered or redeemed digital items are normally non-refundable because they cannot be returned. This includes delivery to a valid destination entered incorrectly by the customer.",
          "Customers should review the game, region, player ID, server and package before payment.",
        ],
      },
      {
        heading: "4. Eligible refund or correction cases",
        paragraphs: [
          "Recharza will investigate duplicate successful charges, payment received without a recoverable order, failed fulfilment, delivery of the wrong item caused by Recharza, or a supplier failure that cannot be corrected within a reasonable period.",
          "Depending on the case, Recharza may retry fulfilment, replace the eligible item, correct the order or return the amount actually received for the affected order.",
        ],
      },
      {
        heading: "5. Bank and provider timing",
        paragraphs: [
          "Approved refunds are submitted to the original payment route where possible. The time required for the amount to appear is controlled by the payment provider, bank or card network after Recharza submits the refund.",
        ],
      },
      {
        heading: "6. How to request help",
        paragraphs: [
          `Open private order tracking first, then contact ${supportEmail} with the order ID, issue description and a screenshot with sensitive payment details hidden. Never send an OTP, UPI PIN, card PIN or password.`,
        ],
      },
      {
        heading: "7. Chargebacks and abuse",
        paragraphs: [
          "Contact Recharza before filing a payment dispute so the order can be investigated. Fraudulent disputes, forged evidence or repeated chargeback abuse may result in account restrictions and preservation of relevant records for the provider investigation.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Notice",
    summary:
      "How Recharza uses essential browser storage and similar technologies.",
    lastUpdated: "6 August 2026",
    sections: [
      {
        heading: "1. Essential storage",
        paragraphs: [
          "Recharza uses cookies or equivalent browser storage that are necessary for secure sessions, account authentication, checkout continuity, order recovery, fraud controls and customer preferences.",
        ],
      },
      {
        heading: "2. Order recovery",
        paragraphs: [
          "For supported guest orders, the browser may store a private order-access credential so the customer can return to tracking. Clearing browser data may remove that local shortcut, so customers should keep their order email or recovery information safe.",
        ],
      },
      {
        heading: "3. Payments and embedded services",
        paragraphs: [
          "Payment providers may use their own cookies or storage when secure checkout is opened. Their use is governed by the provider’s own privacy and cookie information.",
        ],
      },
      {
        heading: "4. Analytics and advertising",
        paragraphs: [
          "Recharza does not currently rely on advertising cookies in the core checkout flow. Any future optional analytics or marketing technology should be disclosed here and, where required, offered through a consent choice before activation.",
        ],
      },
      {
        heading: "5. Browser controls",
        paragraphs: [
          "Browsers allow customers to delete or block stored data. Blocking essential storage may prevent sign-in, checkout, payment recovery or private order tracking from working correctly.",
        ],
      },
      {
        heading: "6. Contact",
        paragraphs: [
          `Questions about browser storage can be sent to ${supportEmail}.`,
        ],
      },
    ],
  },
};

export function parsePublicPolicyKey(value: string): PublicPolicyKey | null {
  return PUBLIC_POLICY_KEYS.includes(value as PublicPolicyKey)
    ? (value as PublicPolicyKey)
    : null;
}
