"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/accounts", label: "Konten" },
  { href: "/months", label: "Monate" },
  { href: "/transactions", label: "Transaktionen" },
  { href: "/reserves", label: "Rückstellungen" },
  { href: "/wealth", label: "Vermögen" },
  { href: "/plan", label: "Plan vs. Ist" },
]

export function Nav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/")
  }

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      onClick={() => setMobileMenuOpen(false)}
      className={cn(
        "block rounded-md px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm font-medium transition-all duration-200 min-h-[44px] sm:min-h-0 flex items-center",
        isActive(href)
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:scale-[0.98]"
      )}
    >
      {label}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-top">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link 
          href="/dashboard" 
          className="text-lg sm:text-xl font-bold tracking-tight transition-opacity hover:opacity-80 active:opacity-70"
        >
          HayBase
        </Link>

        {/* Desktop/Tablet Navigation */}
        <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Abmelden
          </Button>
        </div>

        {/* Mobile/Tablet Navigation */}
        <div className="flex lg:hidden items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menü öffnen">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] md:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-lg sm:text-xl">Menü</SheetTitle>
              </SheetHeader>
              <div className="mt-6 sm:mt-8 flex flex-col space-y-2 sm:space-y-3">
                {navItems.map((item) => (
                  <NavLink key={item.href} href={item.href} label={item.label} />
                ))}
                <div className="pt-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 sm:h-11 text-base sm:text-sm"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut({ callbackUrl: "/login" })
                    }}
                  >
                    Abmelden
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}





