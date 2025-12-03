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

interface CreateAccountTypeDialogProps {
  userId: string
}

export function CreateAccountTypeDialog({ userId }: CreateAccountTypeDialogProps) {
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
      const response = await fetch("/api/account-types", {
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
        alert(data.error || "Fehler beim Erstellen des Kontotyps")
      }
    } catch (error) {
      alert("Fehler beim Erstellen des Kontotyps")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Neuer Kontotyp</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neuer Kontotyp</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Kontotyp.
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
                placeholder="z.B. Girokonto"
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
                placeholder="z.B. CHECKING"
                pattern="[A-Z_]+"
                title="Nur Großbuchstaben und Unterstriche"
              />
              <p className="text-xs text-muted-foreground">
                Eindeutiger Code (z.B. CHECKING, SAVINGS). Wird automatisch in Großbuchstaben konvertiert.
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

