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
    const { userId, name, code } = body

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name und Code sind erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe, ob Code bereits existiert
    const existing = await prisma.accountGroup.findUnique({
      where: {
        userId_code: {
          userId,
          code: code.toUpperCase(),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Eine Kontogruppe mit diesem Code existiert bereits" },
        { status: 400 }
      )
    }

    const accountGroup = await prisma.accountGroup.create({
      data: {
        userId,
        name,
        code: code.toUpperCase(),
      },
    })

    return NextResponse.json(accountGroup)
  } catch (error) {
    console.error("Error creating account group:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

