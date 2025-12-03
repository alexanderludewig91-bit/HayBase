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

    const accountType = await prisma.accountType.findUnique({
      where: { id: params.id },
    })

    if (!accountType || accountType.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name und Code sind erforderlich" },
        { status: 400 }
      )
    }

    // Prüfe, ob Code bereits von einem anderen Typ verwendet wird
    if (code.toUpperCase() !== accountType.code) {
      const existing = await prisma.accountType.findUnique({
        where: {
          userId_code: {
            userId: session.user.id,
            code: code.toUpperCase(),
          },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: "Ein Kontotyp mit diesem Code existiert bereits" },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.accountType.update({
      where: { id: params.id },
      data: {
        name,
        code: code.toUpperCase(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating account type:", error)
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

    const accountType = await prisma.accountType.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    })

    if (!accountType || accountType.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (accountType._count.accounts > 0) {
      return NextResponse.json(
        { error: "Kontotyp wird noch in Konten verwendet" },
        { status: 400 }
      )
    }

    await prisma.accountType.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account type:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

