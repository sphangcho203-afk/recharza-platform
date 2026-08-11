import { getRequestSession } from "@/lib/auth";
import {
  createSavedAddress,
  deleteSavedAddress,
  listSavedAddresses,
  normalizeSavedAddressInput,
  normalizeSavedAddressPatch,
  updateSavedAddress,
} from "@/lib/commerce/saved-addresses";
import { consumeRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const ADDRESS_LIST_LIMIT = 60;
const ADDRESS_LIST_WINDOW_MS = 10 * 60 * 1000;
const ADDRESS_WRITE_LIMIT = 20;
const ADDRESS_WRITE_WINDOW_MS = 10 * 60 * 1000;

function parseAddressId(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().slice(0, 200)
    : null;
}

async function requireSession(request: Request) {
  const session = await getRequestSession(request);
  if (!session) {
    return {
      session: null,
      response: Response.json(
        { ok: false, message: "Sign in to manage your saved addresses." },
        { status: 401 },
      ),
    };
  }
  return { session, response: null };
}

export async function GET(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "GET:/api/account/addresses",
      limit: ADDRESS_LIST_LIMIT,
      windowMs: ADDRESS_LIST_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many address requests. Wait before retrying." },
        { status: 429, headers: rateHeaders },
      );
    }

    const { session, response } = await requireSession(request);
    if (!session) return response;

    const addresses = await listSavedAddresses(session.customer.id);
    return Response.json({ ok: true, addresses }, { headers: rateHeaders });
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Saved address list failed", error);
    }
    return Response.json(
      { ok: false, message: "Saved addresses are temporarily unavailable." },
      { status: 503, headers: rateHeaders },
    );
  }
}

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/account/addresses",
      limit: ADDRESS_WRITE_LIMIT,
      windowMs: ADDRESS_WRITE_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many address changes. Wait before retrying." },
        { status: 429, headers: rateHeaders },
      );
    }

    const { session, response } = await requireSession(request);
    if (!session) return response;

    const payload = await request.json().catch(() => null);
    const validated = normalizeSavedAddressInput(payload);
    if (!validated.ok) {
      return Response.json(
        { ok: false, message: validated.message },
        { status: 400, headers: rateHeaders },
      );
    }

    const address = await createSavedAddress(session.customer.id, validated.address);
    return Response.json({ ok: true, address }, { status: 201, headers: rateHeaders });
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Saved address creation failed", error);
    }
    return Response.json(
      { ok: false, message: "The address could not be saved. Try again shortly." },
      { status: 503, headers: rateHeaders },
    );
  }
}

export async function PATCH(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "PATCH:/api/account/addresses",
      limit: ADDRESS_WRITE_LIMIT,
      windowMs: ADDRESS_WRITE_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many address changes. Wait before retrying." },
        { status: 429, headers: rateHeaders },
      );
    }

    const { session, response } = await requireSession(request);
    if (!session) return response;

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, message: "Saved address updates are required." },
        { status: 400, headers: rateHeaders },
      );
    }

    const data = payload as Record<string, unknown>;
    const addressId = parseAddressId(data.id);
    if (!addressId) {
      return Response.json(
        { ok: false, message: "Provide the address id to update." },
        { status: 400, headers: rateHeaders },
      );
    }

    const validated = normalizeSavedAddressPatch(data);
    if (!validated.ok) {
      return Response.json(
        { ok: false, message: validated.message },
        { status: 400, headers: rateHeaders },
      );
    }

    const address = await updateSavedAddress(session.customer.id, addressId, validated.patch);
    if (!address) {
      return Response.json(
        { ok: false, message: "Saved address not found." },
        { status: 404, headers: rateHeaders },
      );
    }
    return Response.json({ ok: true, address }, { headers: rateHeaders });
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Saved address update failed", error);
    }
    return Response.json(
      { ok: false, message: "The address could not be updated. Try again shortly." },
      { status: 503, headers: rateHeaders },
    );
  }
}

export async function DELETE(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "DELETE:/api/account/addresses",
      limit: ADDRESS_WRITE_LIMIT,
      windowMs: ADDRESS_WRITE_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many address changes. Wait before retrying." },
        { status: 429, headers: rateHeaders },
      );
    }

    const { session, response } = await requireSession(request);
    if (!session) return response;

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, message: "Saved address details are required." },
        { status: 400, headers: rateHeaders },
      );
    }

    const addressId = parseAddressId((payload as Record<string, unknown>).id);
    if (!addressId) {
      return Response.json(
        { ok: false, message: "Provide the address id to delete." },
        { status: 400, headers: rateHeaders },
      );
    }

    const result = await deleteSavedAddress(session.customer.id, addressId);
    if (!result) {
      return Response.json(
        { ok: false, message: "Saved address not found." },
        { status: 404, headers: rateHeaders },
      );
    }
    return Response.json({ ok: true, deleted: true }, { headers: rateHeaders });
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Saved address deletion failed", error);
    }
    return Response.json(
      { ok: false, message: "The address could not be deleted. Try again shortly." },
      { status: 503, headers: rateHeaders },
    );
  }
}
