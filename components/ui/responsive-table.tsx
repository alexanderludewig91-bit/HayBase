"use client"

import { ReactNode } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

interface ResponsiveTableProps {
  headers: { label: string; className?: string }[]
  rows: ReactNode[]
  emptyMessage?: string
  mobileCardView?: boolean
}

export function ResponsiveTable({
  headers,
  rows,
  emptyMessage = "Keine Daten gefunden",
  mobileCardView = true,
}: ResponsiveTableProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Desktop/Tablet: Tabellenansicht */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} className={header.className}>
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{rows}</TableBody>
        </Table>
      </div>

      {/* Mobile: Card-Ansicht */}
      {mobileCardView && (
        <div className="md:hidden space-y-3">
          {rows}
        </div>
      )}
    </>
  )
}

