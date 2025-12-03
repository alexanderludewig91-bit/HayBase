"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Account } from "@prisma/client"

interface TransactionFiltersProps {
  accounts: Account[]
}

export function TransactionFilters({ accounts }: TransactionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/transactions?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <Select
        value={searchParams.get("accountId") || "all"}
        onValueChange={(value) => handleFilterChange("accountId", value)}
      >
        <SelectTrigger className="w-full sm:w-[200px] h-11 sm:h-10">
          <SelectValue placeholder="Alle Konten" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Konten</SelectItem>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") || "all"}
        onValueChange={(value) => handleFilterChange("status", value)}
      >
        <SelectTrigger className="w-full sm:w-[150px] h-11 sm:h-10">
          <SelectValue placeholder="Alle Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Status</SelectItem>
          <SelectItem value="BOOKED">Ist</SelectItem>
          <SelectItem value="PLANNED">Geplant</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("transactionType") || "all"}
        onValueChange={(value) => handleFilterChange("transactionType", value)}
      >
        <SelectTrigger className="w-full sm:w-[150px] h-11 sm:h-10">
          <SelectValue placeholder="Alle Typen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Typen</SelectItem>
          <SelectItem value="INCOME">Einnahmen</SelectItem>
          <SelectItem value="EXPENSE">Ausgaben</SelectItem>
        </SelectContent>
      </Select>

      {(searchParams.get("accountId") ||
        searchParams.get("status") ||
        searchParams.get("transactionType")) && (
        <Button
          variant="outline"
          onClick={() => router.push("/transactions")}
          className="w-full sm:w-auto h-11 sm:h-10"
        >
          Filter zurücksetzen
        </Button>
      )}
    </div>
  )
}

