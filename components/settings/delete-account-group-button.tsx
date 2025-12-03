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

interface DeleteAccountGroupButtonProps {
  accountGroupId: string
  accountCount: number
}

export function DeleteAccountGroupButton({
  accountGroupId,
  accountCount,
}: DeleteAccountGroupButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (accountCount > 0) {
      alert("Diese Kontogruppe wird noch in Konten verwendet und kann nicht gelöscht werden.")
      setOpen(false)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/account-groups/${accountGroupId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Löschen der Kontogruppe")
      }
    } catch (error) {
      alert("Fehler beim Löschen der Kontogruppe")
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
          <DialogTitle>Kontogruppe löschen</DialogTitle>
          <DialogDescription>
            {accountCount > 0 ? (
              <>
                Diese Kontogruppe wird noch in {accountCount} Konto(en) verwendet
                und kann nicht gelöscht werden. Bitte ändern Sie zuerst die
                betroffenen Konten.
              </>
            ) : (
              <>
                Sind Sie sicher, dass Sie diese Kontogruppe löschen möchten? Diese
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

