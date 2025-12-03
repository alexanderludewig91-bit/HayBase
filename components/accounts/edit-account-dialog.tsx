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
import { Pencil } from "lucide-react"

interface AccountType {
  id: string
  name: string
  code: string
}

interface AccountGroup {
  id: string
  name: string
  code: string
}

interface EditAccountDialogProps {
  account: {
    id: string
    name: string
    typeId: string
    groupId: string
    initialBalance: number | null | { toString(): string; toNumber(): number }
    type: AccountType
    group: AccountGroup
  }
}

export function EditAccountDialog({ account }: EditAccountDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([])
  const getInitialBalance = () => {
    if (!account.initialBalance) return "0"
    if (typeof account.initialBalance === "number") {
      return account.initialBalance.toString()
    }
    // Handle Prisma Decimal type
    return Number(account.initialBalance).toString()
  }

  const [formData, setFormData] = useState({
    name: account.name,
    typeId: account.typeId,
    groupId: account.groupId,
    initialBalance: getInitialBalance(),
  })

  useEffect(() => {
    if (open) {
      // Lade Typen und Gruppen
      Promise.all([
        fetch("/api/account-types/list").then((res) => res.json()),
        fetch("/api/account-groups/list").then((res) => res.json()),
      ]).then(([types, groups]) => {
        setAccountTypes(types)
        setAccountGroups(groups)
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          typeId: formData.typeId,
          groupId: formData.groupId,
          initialBalance: formData.initialBalance ? Number(formData.initialBalance) : 0,
        }),
      })

      if (response.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Aktualisieren des Kontos")
      }
    } catch (error) {
      alert("Fehler beim Aktualisieren des Kontos")
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
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Konto bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Kontodetails.
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Typ</Label>
              <Select
                value={formData.typeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, typeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group">Gruppe</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) =>
                  setFormData({ ...formData, groupId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="initialBalance">Startsaldo</Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) =>
                  setFormData({ ...formData, initialBalance: e.target.value })
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

