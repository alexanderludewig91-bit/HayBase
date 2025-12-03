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
    const { userId, year, month } = body

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prüfe, ob Monat bereits existiert
    const existing = await prisma.month.findUnique({
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
        { error: "Monat existiert bereits" },
        { status: 400 }
      )
    }

    const newMonth = await prisma.month.create({
      data: {
        userId,
        year: Number(year),
        month: Number(month),
        status: "OPEN",
      },
    })

    return NextResponse.json(newMonth)
  } catch (error) {
    console.error("Error creating month:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}





