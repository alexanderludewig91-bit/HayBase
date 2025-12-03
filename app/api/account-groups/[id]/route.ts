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
    const { name, code } = body

    const accountGroup = await prisma.accountGroup.findUnique({
      where: { id: params.id },
    })

    if (!accountGroup || accountGroup.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name und Code sind erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe, ob Code bereits von einer anderen Gruppe verwendet wird
    if (code.toUpperCase() !== accountGroup.code) {
      const existing = await prisma.accountGroup.findUnique({
        where: {
          userId_code: {
            userId: session.user.id,
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
    }

    const updated = await prisma.accountGroup.update({
      where: { id: params.id },
      data: {
        name,
        code: code.toUpperCase(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating account group:", error)
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

    const accountGroup = await prisma.accountGroup.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    })

    if (!accountGroup || accountGroup.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (accountGroup._count.accounts > 0) {
      return NextResponse.json(
        { error: "Kontogruppe wird noch in Konten verwendet" },
        { status: 400 }
      )
    }

    await prisma.accountGroup.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account group:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

