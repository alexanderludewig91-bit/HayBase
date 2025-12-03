import { auth } from "@/lib/auth-options"

export async function getServerSession() {
  const session = await auth()
  if (!session || !session.user) {
    return null
  }
  // NextAuth v5 Session-Struktur
  return {
    user: {
      id: (session.user as any).id || "",
      name: (session.user as any).name || session.user.name || "",
    },
  }
}

