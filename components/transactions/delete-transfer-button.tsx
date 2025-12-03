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

interface DeleteTransferButtonProps {
  transferId: string
}

export function DeleteTransferButton({
  transferId,
}: DeleteTransferButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/transfers/${transferId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Löschen der Umbuchung")
      }
    } catch (error) {
      alert("Fehler beim Löschen der Umbuchung")
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
          <DialogTitle>Umbuchung löschen</DialogTitle>
          <DialogDescription>
            Sind Sie sicher, dass Sie diese Umbuchung löschen möchten? Diese
            Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Löschen..." : "Löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

