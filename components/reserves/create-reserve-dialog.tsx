"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Account, TransactionStatus } from "@prisma/client"

interface CreateReserveDialogProps {
  userId: string
  monthId: string
  reserveAccounts: Account[]
}

export function CreateReserveDialog({
  userId,
  monthId,
  reserveAccounts,
}: CreateReserveDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    accountId: "",
    amount: "",
    status: TransactionStatus.BOOKED,
    category: "",
    notes: "",
  })

  useEffect(() => {
    if (open) {
      // Lade Kategorien für Autocomplete
      fetch("/api/reserves/categories")
        .then((res) => res.json())
        .then((cats) => setCategories(cats))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/reserves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          monthId,
          ...formData,
          amount: Number(formData.amount),
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          date: new Date().toISOString().split("T")[0],
          accountId: "",
          amount: "",
          status: TransactionStatus.BOOKED,
          category: "",
          notes: "",
        })
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Erstellen der Rückstellung")
      }
    } catch (error) {
      alert("Fehler beim Erstellen der Rückstellung")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Rückstellung</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rückstellung bilden/auflösen</DialogTitle>
            <DialogDescription>
              Bildung: Positiver Betrag erhöht die Rückstellung. Auflösung: Negativer Betrag reduziert die Rückstellung.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountId">Rückstellungskonto</Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Konto auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {reserveAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Betrag</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
                placeholder="Positiv für Bildung, negativ für Auflösung"
              />
              <p className="text-xs text-muted-foreground">
                Positiver Betrag = Bildung (erhöht Rückstellung), negativer Betrag = Auflösung (reduziert Rückstellung)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as TransactionStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOKED">Ist</SelectItem>
                  <SelectItem value="PLANNED">Geplant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Kategorie</Label>
              <Input
                id="category"
                list="category-list"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                placeholder="z.B. Versicherung, Steuern"
              />
              <datalist id="category-list">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
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

