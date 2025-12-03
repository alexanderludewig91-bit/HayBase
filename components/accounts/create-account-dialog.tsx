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

interface CreateAccountDialogProps {
  userId: string
}

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

export function CreateAccountDialog({ userId }: CreateAccountDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([])
  const [formData, setFormData] = useState({
    name: "",
    typeId: "",
    groupId: "",
    initialBalance: "",
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
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name: formData.name,
          typeId: formData.typeId,
          groupId: formData.groupId,
          initialBalance: formData.initialBalance ? Number(formData.initialBalance) : 0,
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          name: "",
          typeId: "",
          groupId: "",
          initialBalance: "",
        })
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Erstellen des Kontos")
      }
    } catch (error) {
      alert("Fehler beim Erstellen des Kontos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Neues Konto</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neues Konto</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Konto für die Finanzverwaltung.
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
                placeholder="z.B. ING-DiBa Gemeinschaftskonto"
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
                  <SelectValue placeholder="Typ auswählen" />
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
                  <SelectValue placeholder="Gruppe auswählen" />
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
              <Label htmlFor="initialBalance">Startsaldo (optional)</Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) =>
                  setFormData({ ...formData, initialBalance: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !formData.typeId || !formData.groupId}>
              {loading ? "Erstellen..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

