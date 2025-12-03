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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Account } from "@prisma/client"

interface CreateTransferDialogProps {
  userId: string
  monthId: string
  accounts: Account[]
}

export function CreateTransferDialog({
  userId,
  monthId,
  accounts,
}: CreateTransferDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    status: "BOOKED",
    category: "Transfer",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.fromAccountId === formData.toAccountId) {
      alert("Quellkonto und Zielkonto müssen unterschiedlich sein")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/transfers", {
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
          fromAccountId: "",
          toAccountId: "",
          amount: "",
          status: "BOOKED",
          category: "Transfer",
          notes: "",
        })
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Erstellen der Umbuchung")
      }
    } catch (error) {
      alert("Fehler beim Erstellen der Umbuchung")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Umbuchung</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neue Umbuchung</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Umbuchung zwischen zwei Konten.
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
              <Label htmlFor="fromAccountId">Von Konto</Label>
              <Select
                value={formData.fromAccountId}
                onValueChange={(value) =>
                  setFormData({ ...formData, fromAccountId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Quellkonto auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="toAccountId">Zu Konto</Label>
              <Select
                value={formData.toAccountId}
                onValueChange={(value) =>
                  setFormData({ ...formData, toAccountId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Zielkonto auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((account) => account.id !== formData.fromAccountId)
                    .map((account) => (
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
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

