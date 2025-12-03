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
import { Trash2 } from "lucide-react"

interface DeleteAccountTypeButtonProps {
  accountTypeId: string
  accountCount: number
}

export function DeleteAccountTypeButton({
  accountTypeId,
  accountCount,
}: DeleteAccountTypeButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (accountCount > 0) {
      alert("Dieser Kontotyp wird noch in Konten verwendet und kann nicht gelöscht werden.")
      setOpen(false)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/account-types/${accountTypeId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Löschen des Kontotyps")
      }
    } catch (error) {
      alert("Fehler beim Löschen des Kontotyps")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kontotyp löschen</DialogTitle>
          <DialogDescription>
            {accountCount > 0 ? (
              <>
                Dieser Kontotyp wird noch in {accountCount} Konto(en) verwendet
                und kann nicht gelöscht werden. Bitte ändern Sie zuerst die
                betroffenen Konten.
              </>
            ) : (
              <>
                Sind Sie sicher, dass Sie diesen Kontotyp löschen möchten? Diese
                Aktion kann nicht rückgängig gemacht werden.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          {accountCount === 0 && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Löschen..." : "Löschen"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

