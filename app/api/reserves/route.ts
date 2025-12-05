import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TransactionStatus } from "@prisma/client"
import { formatCurrency } from "@/lib/formatters"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, accountId, monthId, date, amount, status, category, notes } = body

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prüfe, ob es ein Rückstellungskonto ist
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { group: true },
    })

    if (!account || account.group.code !== "RESERVE") {
      return NextResponse.json(
        { error: "Nur Rückstellungskonten können für Reserve-Transaktionen verwendet werden" },
        { status: 400 }
      )
    }

    // Wenn es eine Auflösung ist (negativer Betrag), prüfe ob Saldo ausreicht
    const amountValue = Number(amount)
    if (amountValue < 0) {
      // Berechne aktuellen Saldo
      const initialBalance = Number(account.initialBalance || 0)
      const existingReserves = await prisma.reserve.findMany({
        where: {
          accountId,
          status: TransactionStatus.BOOKED,
        },
      })
      const currentBalance = initialBalance + existingReserves.reduce(
        (sum, r) => sum + Number(r.amount),
        0
      )

      // Prüfe ob Auflösung zu negativem Saldo führen würde
      if (currentBalance + amountValue < 0) {
        return NextResponse.json(
          { error: `Auflösung würde zu negativem Saldo führen. Verfügbar: ${formatCurrency(currentBalance)}` },
          { status: 400 }
        )
      }
    }

    const reserve = await prisma.reserve.create({
      data: {
        userId,
        accountId,
        monthId,
        date: new Date(date),
        amount: amountValue,
        status: status || TransactionStatus.BOOKED,
        category,
        notes: notes || null,
      },
    })

    return NextResponse.json(reserve)
  } catch (error) {
    console.error("Error creating reserve:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

