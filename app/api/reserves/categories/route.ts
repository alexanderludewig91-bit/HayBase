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

    // Hole alle eindeutigen Kategorien aus Reserve-Transaktionen
    const reserves = await prisma.reserve.findMany({
      where: { userId: session.user.id },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    })

    const categories = reserves.map((r) => r.category)

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching reserve categories:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

