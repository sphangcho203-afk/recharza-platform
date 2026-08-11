import type { Prisma } from "@/generated/prisma/client";
import {
  parseBillingCountry,
  type BillingCountryCode,
} from "@/lib/commerce/currencies";
import { getPrisma } from "@/lib/prisma";

export { toBillingFormState } from "@/lib/commerce/saved-address-form";

export type SavedAddressInput = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: BillingCountryCode;
};

export type SavedAddressRecord = Omit<SavedAddressInput, "countryCode"> & {
  id: string;
  customerId: string;
  countryCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SavedAddressView = SavedAddressInput & {
  id: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SavedAddressPatch = Partial<SavedAddressInput> & {
  isDefault?: boolean;
};

function clean(value: unknown, maximum: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maximum);
}

function normalizeAddressFields(data: Record<string, unknown>) {
  const country = parseBillingCountry(data.countryCode);
  if (!country) {
    return { countryCode: null, address: null };
  }

  return {
    countryCode: country.code,
    address: {
      fullName: clean(data.fullName, 100),
      email: clean(data.email, 254).toLowerCase(),
      phone: clean(data.phone, 32),
      line1: clean(data.line1, 160),
      line2: clean(data.line2, 160) || null,
      city: clean(data.city, 100),
      state: clean(data.state, 100),
      postalCode: clean(data.postalCode, 24),
      countryCode: country.code,
    } satisfies SavedAddressInput,
  };
}

export function normalizeSavedAddressInput(value: unknown):
  | { ok: true; address: SavedAddressInput }
  | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Saved address details are required." };
  }

  const data = value as Record<string, unknown>;
  const normalized = normalizeAddressFields(data);
  if (!normalized.countryCode || !normalized.address) {
    return { ok: false, message: "Choose a supported billing country." };
  }

  const address = normalized.address;
  if (address.fullName.length < 2) return { ok: false, message: "Enter the billing name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
    return { ok: false, message: "Enter a valid billing email address." };
  }
  if (!/^[+()\-\s\d]{7,32}$/.test(address.phone)) {
    return { ok: false, message: "Enter a valid billing phone number." };
  }
  if (address.line1.length < 4) return { ok: false, message: "Enter the billing address." };
  if (address.city.length < 2) return { ok: false, message: "Enter the billing city." };
  if (address.state.length < 2) {
    return { ok: false, message: "Enter the billing state or province." };
  }
  if (address.postalCode.length < 3) {
    return { ok: false, message: "Enter the billing postal code." };
  }

  return { ok: true, address };
}

export function normalizeSavedAddressPatch(value: unknown):
  | { ok: true; patch: SavedAddressPatch }
  | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Saved address updates are required." };
  }

  const data = value as Record<string, unknown>;
  const patch: SavedAddressPatch = {};

  if (data.isDefault === true) patch.isDefault = true;

  const provided = (key: keyof SavedAddressInput) => data[key] !== undefined;
  const addressFieldKeys: (keyof SavedAddressInput)[] = [
    "fullName",
    "email",
    "phone",
    "line1",
    "line2",
    "city",
    "state",
    "postalCode",
    "countryCode",
  ];
  const hasAddressFields = addressFieldKeys.some(provided);

  if (!hasAddressFields && patch.isDefault === undefined) {
    return { ok: false, message: "Provide at least one address field to update." };
  }

  if (provided("countryCode")) {
    const country = parseBillingCountry(data.countryCode);
    if (!country) return { ok: false, message: "Choose a supported billing country." };
    patch.countryCode = country.code;
  }

  if (provided("fullName")) {
    const fullName = clean(data.fullName, 100);
    if (fullName.length < 2) return { ok: false, message: "Enter the billing name." };
    patch.fullName = fullName;
  }

  if (provided("email")) {
    const email = clean(data.email, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: "Enter a valid billing email address." };
    }
    patch.email = email;
  }

  if (provided("phone")) {
    const phone = clean(data.phone, 32);
    if (!/^[+()\-\s\d]{7,32}$/.test(phone)) {
      return { ok: false, message: "Enter a valid billing phone number." };
    }
    patch.phone = phone;
  }

  if (provided("line1")) {
    const line1 = clean(data.line1, 160);
    if (line1.length < 4) return { ok: false, message: "Enter the billing address." };
    patch.line1 = line1;
  }

  if (provided("line2")) {
    patch.line2 = clean(data.line2, 160) || null;
  }

  if (provided("city")) {
    const city = clean(data.city, 100);
    if (city.length < 2) return { ok: false, message: "Enter the billing city." };
    patch.city = city;
  }

  if (provided("state")) {
    const state = clean(data.state, 100);
    if (state.length < 2) {
      return { ok: false, message: "Enter the billing state or province." };
    }
    patch.state = state;
  }

  if (provided("postalCode")) {
    const postalCode = clean(data.postalCode, 24);
    if (postalCode.length < 3) {
      return { ok: false, message: "Enter the billing postal code." };
    }
    patch.postalCode = postalCode;
  }

  return { ok: true, patch };
}

export function serializeSavedAddress(record: SavedAddressRecord): SavedAddressView {
  return {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    phone: record.phone,
    line1: record.line1,
    line2: record.line2,
    city: record.city,
    state: record.state,
    postalCode: record.postalCode,
    countryCode: record.countryCode as BillingCountryCode,
    isDefault: record.isDefault,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listSavedAddresses(customerId: string): Promise<SavedAddressView[]> {
  const records = await getPrisma().customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  return records.map(serializeSavedAddress);
}

async function lockCustomerRow(
  transaction: Prisma.TransactionClient,
  customerId: string,
) {
  await transaction.$queryRaw`SELECT id FROM "Customer" WHERE id = ${customerId} FOR UPDATE`;
}

export async function createSavedAddress(
  customerId: string,
  input: SavedAddressInput,
): Promise<SavedAddressView> {
  const prisma = getPrisma();
  return prisma.$transaction(async (transaction) => {
    await lockCustomerRow(transaction, customerId);
    const existingCount = await transaction.customerAddress.count({
      where: { customerId },
    });
    const created = await transaction.customerAddress.create({
      data: {
        customerId,
        ...input,
        isDefault: existingCount === 0,
      },
    });
    return serializeSavedAddress(created);
  });
}

export async function updateSavedAddress(
  customerId: string,
  addressId: string,
  patch: SavedAddressPatch,
): Promise<SavedAddressView | null> {
  const prisma = getPrisma();
  return prisma.$transaction(async (transaction) => {
    if (patch.isDefault === true) {
      await lockCustomerRow(transaction, customerId);
    }

    const updated = await transaction.customerAddress.updateMany({
      where: { id: addressId, customerId },
      data: patch,
    });
    if (updated.count === 0) return null;

    if (patch.isDefault === true) {
      await transaction.customerAddress.updateMany({
        where: { customerId, id: { not: addressId }, isDefault: true },
        data: { isDefault: false },
      });
    }

    const record = await transaction.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });
    if (!record) return null;

    return serializeSavedAddress(record);
  });
}

export async function deleteSavedAddress(
  customerId: string,
  addressId: string,
): Promise<{ deleted: true } | null> {
  const prisma = getPrisma();
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });
    if (!existing) return null;

    if (existing.isDefault) {
      await lockCustomerRow(transaction, customerId);
    }

    const deleted = await transaction.customerAddress.deleteMany({
      where: { id: addressId, customerId },
    });
    if (deleted.count === 0) return null;

    if (existing.isDefault) {
      const newest = await transaction.customerAddress.findFirst({
        where: { customerId },
        orderBy: { updatedAt: "desc" },
      });
      if (newest) {
        await transaction.customerAddress.update({
          where: { id: newest.id },
          data: { isDefault: true },
        });
      }
    }

    return { deleted: true };
  });
}
