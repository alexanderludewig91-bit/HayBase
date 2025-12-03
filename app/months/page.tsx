import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatMonthYear } from "@/lib/formatters"
import { CreateMonthDialog } from "@/components/months/create-month-dialog"

async function getMonths(userId: string) {
  return await prisma.month.findMany({
    where: { userId },
    orderBy: [
      { year: "desc" },
      { month: "desc" },
    ],
    include: {
      transactions: {
        where: {
          status: "BOOKED",
        },
      },
    },
  })
}

export default async function MonthsPage() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const months = await getMonths(session.user.id)

  // Berechne Net Cashflow für jeden Monat
  const monthsWithCashflow = months.map((month) => {
    const income = month.transactions
      .filter((t) => t.transactionType === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = month.transactions
      .filter((t) => t.transactionType === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return {
      ...month,
      netCashflow: income - expenses,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monate</h1>
          <p className="text-sm text-muted-foreground mt-2">Übersicht aller Monate</p>
        </div>
        <CreateMonthDialog userId={session.user.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monatsübersicht</CardTitle>
          <CardDescription>Alle Monate mit Status und Net Cashflow</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop/Tablet: Tabellenansicht */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Net Cashflow (Ist)</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthsWithCashflow.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Keine Monate gefunden. Erstellen Sie einen neuen Monat.
                    </TableCell>
                  </TableRow>
                ) : (
                  monthsWithCashflow.map((month) => (
                    <TableRow key={month.id}>
                      <TableCell className="font-medium">
                        {formatMonthYear(month.month, month.year)}
                      </TableCell>
                      <TableCell>
                        <span className={`rounded px-2 py-1 text-xs ${month.status === "OPEN" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {month.status === "OPEN" ? "Offen" : "Geschlossen"}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right ${month.netCashflow >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {new Intl.NumberFormat("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        }).format(month.netCashflow)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/months/${month.id}`}>
                          <Button variant="outline" size="sm">
                            Öffnen
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Card-Ansicht */}
          <div className="md:hidden space-y-3">
            {monthsWithCashflow.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Keine Monate gefunden. Erstellen Sie einen neuen Monat.
              </div>
            ) : (
              monthsWithCashflow.map((month) => (
                <Card key={month.id} className="overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base mb-2">
                          {formatMonthYear(month.month, month.year)}
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${month.status === "OPEN" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {month.status === "OPEN" ? "Offen" : "Geschlossen"}
                        </span>
                      </div>
                      <div className={`text-lg font-bold tabular-nums shrink-0 ${month.netCashflow >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {new Intl.NumberFormat("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        }).format(month.netCashflow)}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border/50">
                      <Link href={`/months/${month.id}`} className="block">
                        <Button variant="outline" className="w-full">
                          Öffnen
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





