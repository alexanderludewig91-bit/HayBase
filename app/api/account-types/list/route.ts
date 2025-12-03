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

    const accountTypes = await prisma.accountType.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(accountTypes)
  } catch (error) {
    console.error("Error fetching account types:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

