import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, monthId, date, accountId, amount, status, category, notes } = body

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Automatische Zuordnung: Positiver Betrag = Einnahme, negativer Betrag = Ausgabe
    const amountValue = Number(amount)
    const transactionType = amountValue >= 0 ? "INCOME" : "EXPENSE"
    // Speichere Betrag immer als positiven Wert
    const absoluteAmount = Math.abs(amountValue)

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        monthId,
        accountId,
        date: new Date(date),
        amount: absoluteAmount,
        transactionType,
        status,
        category,
        notes: notes || null,
      },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}





