import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accountGroups = await prisma.accountGroup.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(accountGroups)
  } catch (error) {
    console.error("Error fetching account groups:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

