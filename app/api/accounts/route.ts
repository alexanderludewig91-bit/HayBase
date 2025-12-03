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
    const { userId, name, typeId, groupId, initialBalance } = body

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!name || !typeId || !groupId) {
      return NextResponse.json(
        { error: "Name, Typ und Gruppe sind erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe, ob Typ und Gruppe existieren und dem User gehören
    const [accountType, accountGroup] = await Promise.all([
      prisma.accountType.findFirst({
        where: { id: typeId, userId },
      }),
      prisma.accountGroup.findFirst({
        where: { id: groupId, userId },
      }),
    ])

    if (!accountType || !accountGroup) {
      return NextResponse.json(
        { error: "Ungültiger Typ oder Gruppe" },
        { status: 400 }
      )
    }

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        typeId,
        groupId,
        initialBalance: initialBalance ? Number(initialBalance) : 0,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error("Error creating account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

