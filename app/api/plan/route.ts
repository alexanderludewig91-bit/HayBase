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
    const { userId, year, month, plannedNetWorth, plannedCashflow } = body

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prüfe, ob Plan bereits existiert
    const existing = await prisma.planSnapshot.findUnique({
      where: {
        userId_year_month: {
          userId,
          year: Number(year),
          month: Number(month),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Plan für diesen Monat existiert bereits" },
        { status: 400 }
      )
    }

    const plan = await prisma.planSnapshot.create({
      data: {
        userId,
        year: Number(year),
        month: Number(month),
        plannedNetWorth: Number(plannedNetWorth),
        plannedCashflow: plannedCashflow ? Number(plannedCashflow) : null,
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Error creating plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}





