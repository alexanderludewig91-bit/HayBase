import { Nav } from "@/components/layout/nav"
import { InstallPrompt } from "@/components/pwa/install-prompt"

export default function ReservesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {children}
      </main>
      <InstallPrompt />
    </div>
  )
}

