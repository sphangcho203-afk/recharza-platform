import {
  createCustomerSession,
  createSessionCookie,
  normalizeAuthEmail,
  normalizeUsername,
  resolveBootstrapRole,
} from "@/lib/auth";
import {
  hashCustomerPassword,
  validateCustomerPassword,
} from "@/lib/customer-password";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { sendAccountCreatedEmail } from "@/lib/transactional-email";

export const runtime = "nodejs";

const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW_MS = 15 * 60 * 1000;

function normalizeDisplayName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 80 ? name : null;
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002",
  );
}

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/auth/signup",
      limit: SIGNUP_LIMIT,
      windowMs: SIGNUP_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          ok: false,
          message: "Too many account-creation attempts. Wait before retrying.",
        },
        { status: 429, headers: rateHeaders },
      );
    }

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, message: "Account details are required." },
        { status: 400, headers: rateHeaders },
      );
    }

    const data = payload as Record<string, unknown>;
    const displayName = normalizeDisplayName(data.name);
    const username = normalizeUsername(data.username);
    const email = normalizeAuthEmail(data.email);
    const passwordResult = validateCustomerPassword(data.password);

    if (!displayName) {
      return Response.json(
        { ok: false, field: "name", message: "Enter your full name." },
        { status: 400, headers: rateHeaders },
      );
    }

    if (!username) {
      return Response.json(
        {
          ok: false,
          field: "username",
          message:
            "Username must be 3–24 characters using lowercase letters, numbers, or underscores.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    if (!email) {
      return Response.json(
        { ok: false, field: "email", message: "Enter a valid email address." },
        { status: 400, headers: rateHeaders },
      );
    }

    if (!passwordResult.ok) {
      return Response.json(
        { ok: false, field: "password", message: passwordResult.message },
        { status: 400, headers: rateHeaders },
      );
    }

    if (data.password !== data.confirmPassword) {
      return Response.json(
        {
          ok: false,
          field: "confirmPassword",
          message: "The passwords do not match.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const prisma = getPrisma();
    const [emailCustomer, usernameCustomer] = await Promise.all([
      prisma.customer.findUnique({ where: { email } }),
      prisma.customer.findUnique({ where: { username } }),
    ]);

    if (usernameCustomer && usernameCustomer.id !== emailCustomer?.id) {
      return Response.json(
        {
          ok: false,
          field: "username",
          message: "That username is already taken.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    if (emailCustomer?.passwordHash) {
      return Response.json(
        {
          ok: false,
          field: "email",
          message: "An account already exists for that email. Sign in instead.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const passwordHash = await hashCustomerPassword(passwordResult.password);
    const now = new Date();

    let customer;
    try {
      customer = await prisma.$transaction(async (transaction) => {
        const account = emailCustomer
          ? await transaction.customer.update({
              where: { id: emailCustomer.id },
              data: {
                displayName,
                username,
                passwordHash,
                passwordUpdatedAt: now,
                lastLoginAt: now,
              },
            })
          : await transaction.customer.create({
              data: {
                email,
                displayName,
                username,
                passwordHash,
                passwordUpdatedAt: now,
                lastLoginAt: now,
                role: resolveBootstrapRole(email),
              },
            });

        const activeCart = await transaction.cart.findFirst({
          where: { customerId: account.id, status: "ACTIVE" },
          select: { id: true },
        });
        if (!activeCart) {
          await transaction.cart.create({
            data: { customerId: account.id },
          });
        }

        return account;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return Response.json(
          {
            ok: false,
            message: "That email or username is already connected to an account.",
          },
          { status: 409, headers: rateHeaders },
        );
      }
      throw error;
    }

    const session = await createCustomerSession(customer.id, request);

    let emailQueued = false;
    try {
      const delivery = await sendAccountCreatedEmail({
        customerId: customer.id,
        email: customer.email,
        displayName: customer.displayName ?? displayName,
        username: customer.username ?? username,
        createdAt: customer.createdAt,
      });
      emailQueued = delivery.ok;
    } catch (error) {
      console.error("Account-created email could not be recorded", error);
    }

    return Response.json(
      {
        ok: true,
        message: "Account created successfully.",
        customer: {
          id: customer.id,
          name: customer.displayName,
          username: customer.username,
          email: customer.email,
          createdAt: customer.createdAt.toISOString(),
        },
        emailQueued,
      },
      {
        status: 201,
        headers: {
          ...rateHeaders,
          "Cache-Control": "no-store",
          "Set-Cookie": createSessionCookie(
            session.sessionToken,
            session.expiresAt,
          ),
        },
      },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Customer signup failed", error);
    }

    return Response.json(
      {
        ok: false,
        message: "The account could not be created safely. Try again shortly.",
      },
      { status: 503, headers: rateHeaders },
    );
  }
}
