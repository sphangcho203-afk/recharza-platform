import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function getCustomerId(request: Request) {
  const { getCurrentCustomer } = await import("@/lib/auth/session")
  const customer = await getCurrentCustomer(request)
  return customer?.id ?? null
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const customerId = await getCustomerId(request)
    if (!customerId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    const { id } = await context.params

    const result = await prisma.$executeRawUnsafe(`DELETE FROM "SavedAddress" WHERE "id" = $1 AND "customerId" = $2`, id, customerId)
    if (result === 0) return NextResponse.json({ error: "Address not found" }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete saved address", error)
    return NextResponse.json({ error: "Unable to delete saved address" }, { status: 500 })
  }
}
