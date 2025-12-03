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
    const { userId, monthId, fromAccountId, toAccountId, date, amount, status, category, notes } = body

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json({ error: "Quellkonto und Zielkonto müssen unterschiedlich sein" }, { status: 400 })
    }

    // Erstelle Transfer
    const transfer = await prisma.transfer.create({
      data: {
        userId,
        monthId,
        fromAccountId,
        toAccountId,
        date: new Date(date),
        amount: Number(amount),
        status: status || "BOOKED",
        category: category || "Transfer",
        notes: notes || null,
      },
    })

    return NextResponse.json(transfer)
  } catch (error) {
    console.error("Error creating transfer:", error)
    return NextResponse.json(
      { error: "Failed to create transfer" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthId = searchParams.get("monthId")

    if (!monthId) {
      return NextResponse.json({ error: "monthId is required" }, { status: 400 })
    }

    const transfers = await prisma.transfer.findMany({
      where: {
        userId: session.user.id,
        monthId,
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(transfers)
  } catch (error) {
    console.error("Error fetching transfers:", error)
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    )
  }
}

