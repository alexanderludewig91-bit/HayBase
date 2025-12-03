"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { InstallPrompt } from "@/components/pwa/install-prompt"

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Add page transition class
    document.body.classList.add("page-transition")
    
    // Remove transition class after animation
    const timer = setTimeout(() => {
      document.body.classList.remove("page-transition")
    }, 200)

    return () => clearTimeout(timer)
  }, [pathname])

  // Prevent pull-to-refresh on mobile (app-like behavior)
  useEffect(() => {
    let touchStartY = 0
    let touchEndY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      touchEndY = e.touches[0].clientY
      // Prevent pull-to-refresh when scrolling down
      if (window.scrollY === 0 && touchEndY > touchStartY) {
        e.preventDefault()
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
    }
  }, [])

  return (
    <>
      {children}
      <InstallPrompt />
    </>
  )
}

