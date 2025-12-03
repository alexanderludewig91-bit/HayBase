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

interface CreatePlanDialogProps {
  userId: string
}

export function CreatePlanDialog({ userId }: CreatePlanDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [plannedNetWorth, setPlannedNetWorth] = useState("")
  const [plannedCashflow, setPlannedCashflow] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          year: Number(year),
          month: Number(month),
          plannedNetWorth: Number(plannedNetWorth),
          plannedCashflow: plannedCashflow ? Number(plannedCashflow) : null,
        }),
      })

      if (response.ok) {
        setOpen(false)
        setPlannedNetWorth("")
        setPlannedCashflow("")
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Erstellen des Plans")
      }
    } catch (error) {
      alert("Fehler beim Erstellen des Plans")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Neuen Plan anlegen</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neuen Plan anlegen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen Plan für einen Monat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="year">Jahr</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2000}
                max={2100}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="month">Monat</Label>
              <Select value={month.toString()} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plannedNetWorth">Geplantes Vermögen</Label>
              <Input
                id="plannedNetWorth"
                type="number"
                step="0.01"
                value={plannedNetWorth}
                onChange={(e) => setPlannedNetWorth(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plannedCashflow">Geplanter Cashflow (optional)</Label>
              <Input
                id="plannedCashflow"
                type="number"
                step="0.01"
                value={plannedCashflow}
                onChange={(e) => setPlannedCashflow(e.target.value)}
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





