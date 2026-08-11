import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"

// Saved addresses intentionally use SQL here until the Prisma schema/client is regenerated
// in the normal deployment migration pipeline.
async function getCustomerId(request: Request) {
  const { getCurrentCustomer } = await import("@/lib/auth/session")
  const customer = await getCurrentCustomer(request)
  return customer?.id ?? null
}

export async function GET(request: Request) {
  try {
    const customerId = await getCustomerId(request)
    if (!customerId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const addresses = await prisma.$queryRawUnsafe(`
      SELECT "id", "label", "fullName", "addressLine1", "addressLine2", "city", "state", "postalCode", "country", "phone", "isDefault", "createdAt", "updatedAt"
      FROM "SavedAddress"
      WHERE "customerId" = $1
      ORDER BY "isDefault" DESC, "updatedAt" DESC
    `, customerId)

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("Failed to load saved addresses", error)
    return NextResponse.json({ error: "Unable to load saved addresses" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const customerId = await getCustomerId(request)
    if (!customerId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const body = await request.json()
    const fullName = String(body.fullName ?? "").trim()
    const addressLine1 = String(body.addressLine1 ?? "").trim()
    const addressLine2 = body.addressLine2 ? String(body.addressLine2).trim() : null
    const city = String(body.city ?? "").trim()
    const state = String(body.state ?? "").trim()
    const postalCode = String(body.postalCode ?? "").trim()
    const country = String(body.country ?? "India").trim()
    const phone = body.phone ? String(body.phone).trim() : null
    const label = body.label ? String(body.label).trim() : null
    const isDefault = Boolean(body.isDefault)

    if (!fullName || !addressLine1 || !city || !state || !postalCode) {
      return NextResponse.json({ error: "Required address fields are missing" }, { status: 400 })
    }

    const id = randomUUID()
    const now = new Date()

    await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.$executeRawUnsafe(`UPDATE "SavedAddress" SET "isDefault" = false WHERE "customerId" = $1`, customerId)
      }
      await tx.$executeRawUnsafe(`
        INSERT INTO "SavedAddress" ("id", "customerId", "label", "fullName", "addressLine1", "addressLine2", "city", "state", "postalCode", "country", "phone", "isDefault", "createdAt", "updatedAt")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)
      `, id, customerId, label, fullName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault, now)
    })

    return NextResponse.json({ ok: true, id })
  } catch (error) {
    console.error("Failed to save address", error)
    return NextResponse.json({ error: "Unable to save address" }, { status: 500 })
  }
}
