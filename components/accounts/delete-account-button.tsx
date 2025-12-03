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

interface DeleteAccountButtonProps {
  accountId: string
  transactionCount: number
}

export function DeleteAccountButton({
  accountId,
  transactionCount,
}: DeleteAccountButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Fehler beim Löschen des Kontos")
      }
    } catch (error) {
      alert("Fehler beim Löschen des Kontos")
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
          <DialogTitle>Konto löschen</DialogTitle>
          <DialogDescription>
            {transactionCount > 0 ? (
              <>
                Dieses Konto hat {transactionCount} Transaktion(en). Beim Löschen
                werden alle zugehörigen Transaktionen ebenfalls gelöscht. Diese
                Aktion kann nicht rückgängig gemacht werden.
              </>
            ) : (
              <>
                Sind Sie sicher, dass Sie dieses Konto löschen möchten? Diese
                Aktion kann nicht rückgängig gemacht werden.
              </>
            )}
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

