import { Nav } from "@/components/layout/nav"
import { AppWrapper } from "@/components/layout/app-wrapper"

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppWrapper>
      <Nav />
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">{children}</main>
    </AppWrapper>
  )
}

