import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { date, accountId, name, amount, status, category, notes } = body

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    })

    if (!transaction || transaction.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Automatische Zuordnung: Positiver Betrag = Einnahme, negativer Betrag = Ausgabe
    const amountValue = Number(amount)
    const transactionType = amountValue >= 0 ? "INCOME" : "EXPENSE"
    // Speichere Betrag immer als positiven Wert
    const absoluteAmount = Math.abs(amountValue)

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        date: new Date(date),
        accountId,
        name: name || "",
        amount: absoluteAmount,
        transactionType,
        status,
        category,
        notes: notes || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    })

    if (!transaction || transaction.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.transaction.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}





