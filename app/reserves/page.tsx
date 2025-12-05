import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionStatus } from "@prisma/client"
import { formatCurrency, formatMonthYear } from "@/lib/formatters"
import { CreateReserveDialog } from "@/components/reserves/create-reserve-dialog"
import { DeleteReserveButton } from "@/components/reserves/delete-reserve-button"

async function getCurrentMonth(userId: string) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  let month = await prisma.month.findFirst({
    where: {
      userId,
      year: currentYear,
      month: currentMonth,
    },
  })

  if (!month) {
    month = await prisma.month.findFirst({
      where: { userId },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
      ],
    })
  }

  return month
}

async function getReserveAccounts(userId: string) {
  return await prisma.account.findMany({
    where: {
      userId,
      group: {
        code: "RESERVE",
      },
    },
    include: {
      type: true,
      group: true,
    },
    orderBy: { name: "asc" },
  })
}

async function getReservesWithBalances(userId: string, monthId: string | null) {
  if (!monthId) {
    return []
  }

  const reserveAccounts = await getReserveAccounts(userId)
  const reserves = await prisma.reserve.findMany({
    where: {
      userId,
      monthId,
    },
    include: {
      account: true,
    },
    orderBy: {
      date: "desc",
    },
  })

  // Berechne Salden für jedes Rückstellungskonto
  const accountsWithBalances = reserveAccounts.map((account) => {
    let balance = Number(account.initialBalance || 0)
    
    // Summiere alle Reserve-Transaktionen für dieses Konto
    reserves.forEach((r) => {
      if (r.accountId === account.id && r.status === TransactionStatus.BOOKED) {
        balance += Number(r.amount)
      }
    })
    
    return { ...account, balance }
  })

  return { accounts: accountsWithBalances, reserves }
}

export default async function ReservesPage() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const month = await getCurrentMonth(session.user.id)
  if (!month) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rückstellungen</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Kein Monat gefunden. Bitte erstellen Sie einen Monat.
          </p>
        </div>
      </div>
    )
  }

  const { accounts, reserves } = await getReservesWithBalances(session.user.id, month.id)
  const reserveAccounts = accounts

  // Berechne Gesamtsumme
  const totalReserves = accounts.reduce((sum, a) => sum + a.balance, 0)

  // Gruppiere nach Konten
  const reservesByAccount = accounts.map((account) => ({
    account,
    reserves: reserves.filter((r) => r.accountId === account.id),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rückstellungen</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {month ? `Rückstellungen für ${formatMonthYear(month.month, month.year)}` : "Kein Monat gefunden"}
          </p>
        </div>
        {month && (
          <CreateReserveDialog userId={session.user.id} monthId={month.id} reserveAccounts={reserveAccounts} />
        )}
      </div>

      {month && (
        <>
          {/* Übersicht Rückstellungskonten */}
          <Card>
            <CardHeader>
              <CardTitle>Rückstellungskonten</CardTitle>
              <CardDescription>Übersicht aller Rückstellungskonten mit aktuellen Salden</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                  <div key={account.id} className="rounded-lg border border-border/40 bg-background/50 p-5 transition-all duration-200 hover:border-border/60 hover:shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground mb-2">{account.name}</div>
                    <div className="text-xl font-bold tabular-nums">
                      {formatCurrency(account.balance)}
                    </div>
                  </div>
                ))}
              </div>
              {accounts.length > 0 && (
                <div className="mt-6 border-t border-border/40 pt-6">
                  <div className="flex justify-between text-base font-semibold tabular-nums">
                    <span>Gesamtsumme</span>
                    <span>{formatCurrency(totalReserves)}</span>
                  </div>
                </div>
              )}
              {accounts.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Keine Rückstellungskonten gefunden
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reserve-Transaktionen */}
          <Card>
            <CardHeader>
              <CardTitle>Reserve-Transaktionen</CardTitle>
              <CardDescription>
                {reserves.length} Transaktion(en) gefunden
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservesByAccount.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Keine Reserve-Transaktionen gefunden
                </div>
              ) : (
                <div className="space-y-6">
                  {reservesByAccount.map(({ account, reserves: accountReserves }) => {
                    if (accountReserves.length === 0) return null

                    return (
                      <div key={account.id}>
                        <h3 className="text-base font-semibold mb-3">{account.name}</h3>
                        {/* Desktop/Tablet: Tabellenansicht */}
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Datum</TableHead>
                                <TableHead>Kategorie</TableHead>
                                <TableHead className="text-right">Betrag</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aktionen</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {accountReserves.map((reserve) => (
                                <TableRow key={reserve.id}>
                                  <TableCell>
                                    {new Date(reserve.date).toLocaleDateString("de-DE")}
                                  </TableCell>
                                  <TableCell>{reserve.category}</TableCell>
                                  <TableCell className={`text-right tabular-nums ${Number(reserve.amount) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {Number(reserve.amount) >= 0 ? "+" : ""}
                                    {formatCurrency(Number(reserve.amount))}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${reserve.status === "BOOKED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                      {reserve.status === "BOOKED" ? "Ist" : "Geplant"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DeleteReserveButton reserveId={reserve.id} />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile: Card-Ansicht */}
                        <div className="md:hidden space-y-3">
                          {accountReserves.map((reserve) => (
                            <Card key={reserve.id} className="p-4">
                              <div className="flex flex-col space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-semibold text-base mb-1">{reserve.category}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {new Date(reserve.date).toLocaleDateString("de-DE")}
                                    </div>
                                  </div>
                                  <div className={`text-lg font-bold tabular-nums ${Number(reserve.amount) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {Number(reserve.amount) >= 0 ? "+" : ""}
                                    {formatCurrency(Number(reserve.amount))}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${reserve.status === "BOOKED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                    {reserve.status === "BOOKED" ? "Ist" : "Geplant"}
                                  </span>
                                  <DeleteReserveButton reserveId={reserve.id} />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

