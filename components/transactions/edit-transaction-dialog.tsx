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
import { Account, Transaction, TransactionStatus } from "@prisma/client"
import { Pencil } from "lucide-react"

interface EditTransactionDialogProps {
  transaction: Transaction & { account: Account }
  accounts: Account[]
}

export function EditTransactionDialog({
  transaction,
  accounts,
}: EditTransactionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  // Berechne den Betrag mit Vorzeichen basierend auf dem Typ
  const getAmountWithSign = () => {
    const amount = Number(transaction.amount)
    return transaction.transactionType === "EXPENSE" ? -amount : amount
  }

  const [formData, setFormData] = useState<{
    date: string
    accountId: string
    amount: string
    status: TransactionStatus
    category: string
    notes: string
  }>({
    date: new Date(transaction.date).toISOString().split("T")[0],
    accountId: transaction.accountId,
    amount: getAmountWithSign().toString(),
    status: transaction.status,
    category: transaction.category,
    notes: transaction.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
        }),
      })

      if (response.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Aktualisieren der Transaktion")
      }
    } catch (error) {
      alert("Fehler beim Aktualisieren der Transaktion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Transaktion bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Transaktionsdetails.
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
              <Label htmlFor="accountId">Konto</Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
                placeholder="Positiv für Einnahme, negativ für Ausgabe"
              />
              <p className="text-xs text-muted-foreground">
                Positiver Betrag = Einnahme, negativer Betrag = Ausgabe
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
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              />
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
              {loading ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}





