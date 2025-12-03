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
    const { name, typeId, groupId, initialBalance } = body

    const account = await prisma.account.findUnique({
      where: { id: params.id },
    })

    if (!account || account.userId !== session.user.id) {
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
        where: { id: typeId, userId: session.user.id },
      }),
      prisma.accountGroup.findFirst({
        where: { id: groupId, userId: session.user.id },
      }),
    ])

    if (!accountType || !accountGroup) {
      return NextResponse.json(
        { error: "Ungültiger Typ oder Gruppe" },
        { status: 400 }
      )
    }

    const updated = await prisma.account.update({
      where: { id: params.id },
      data: {
        name,
        typeId,
        groupId,
        initialBalance: initialBalance ? Number(initialBalance) : 0,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating account:", error)
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

    const account = await prisma.account.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prisma löscht automatisch alle zugehörigen Transaktionen durch onDelete: Cascade
    await prisma.account.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

