"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateAccountGroupDialogProps {
  userId: string
}

export function CreateAccountGroupDialog({ userId }: CreateAccountGroupDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/account-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...formData,
          code: formData.code.toUpperCase().replace(/\s+/g, "_"),
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({ name: "", code: "" })
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Erstellen der Kontogruppe")
      }
    } catch (error) {
      alert("Fehler beim Erstellen der Kontogruppe")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Neue Kontogruppe</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neue Kontogruppe</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue Kontogruppe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="z.B. Liquide Mittel"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                required
                placeholder="z.B. LIQUID"
                pattern="[A-Z_]+"
                title="Nur Großbuchstaben und Unterstriche"
              />
              <p className="text-xs text-muted-foreground">
                Eindeutiger Code (z.B. LIQUID, INVESTMENT). Wird automatisch in Großbuchstaben konvertiert.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Erstellen..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

