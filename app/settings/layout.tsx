import { Nav } from "@/components/layout/nav"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </>
  )
}

