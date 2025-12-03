import { handlers } from "@/lib/auth-options"

// Force Node.js runtime to avoid Edge Runtime warnings with bcryptjs
export const runtime = "nodejs"

export const { GET, POST } = handlers

