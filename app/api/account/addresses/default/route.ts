import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function getCustomerId(request: Request) {
  const { getCurrentCustomer } = await import("@/lib/auth/session")
  const customer = await getCurrentCustomer(request)
  return customer?.id ?? null
}

export async function POST(request: Request) {
  try {
    const customerId = await getCustomerId(request)
    if (!customerId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    const { id } = await request.json()
    const addressId = String(id ?? "").trim()
    if (!addressId) return NextResponse.json({ error: "Address id is required" }, { status: 400 })

    const result = await prisma.$transaction(async (tx) => {
      const owned = await tx.$queryRawUnsafe<Array<{ id: string }>>(`SELECT "id" FROM "SavedAddress" WHERE "id" = $1 AND "customerId" = $2 LIMIT 1`, addressId, customerId)
      if (!owned[0]) return false
      await tx.$executeRawUnsafe(`UPDATE "SavedAddress" SET "isDefault" = false WHERE "customerId" = $1`, customerId)
      await tx.$executeRawUnsafe(`UPDATE "SavedAddress" SET "isDefault" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1 AND "customerId" = $2`, addressId, customerId)
      return true
    })

    if (!result) return NextResponse.json({ error: "Address not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to set default address", error)
    return NextResponse.json({ error: "Unable to update default address" }, { status: 500 })
  }
}
