import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionStatus } from "@prisma/client"
import { formatCurrency, formatMonthYear } from "@/lib/formatters"
import { CreateReserveDialog } from "@/components/reserves/create-reserve-dialog"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getCurrentMonth(userId: string) {
  // Hole den aktuellen Monat (OPEN) oder den letzten Monat
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  let month = await prisma.month.findFirst({
    where: {
      userId,
      year: currentYear,
      month: currentMonth,
    },
    include: {
      transactions: {
        include: {
          account: true,
        },
        orderBy: {
          date: "desc",
        },
      },
      reserves: {
        include: {
          account: true,
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  })

  if (!month) {
    // Fallback: neuester Monat
    month = await prisma.month.findFirst({
      where: { userId },
      include: {
        transactions: {
          include: {
            account: true,
          },
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
      ],
    })
  }

  return month
}

async function getAccountsWithBalances(userId: string, monthId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      type: true,
      group: true,
    },
    orderBy: [
      { group: { name: "asc" } },
      { name: "asc" },
    ],
  })

  const [transactions, transfers, reserves] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        monthId,
        status: TransactionStatus.BOOKED,
      },
    }),
    prisma.transfer.findMany({
      where: {
        userId,
        monthId,
        status: TransactionStatus.BOOKED,
      },
    }),
    prisma.reserve.findMany({
      where: {
        userId,
        monthId,
        status: TransactionStatus.BOOKED,
      },
    }),
  ])

  // Berechne Salden
  const accountBalances = accounts.map((account) => {
    let balance = Number(account.initialBalance || 0)
    
    // Transaktionen (nur für nicht-Rückstellungskonten)
    if (account.group.code !== "RESERVE") {
      transactions.forEach((t) => {
        if (t.accountId === account.id) {
          if (t.transactionType === "INCOME") {
            balance += Number(t.amount)
          } else {
            balance -= Number(t.amount)
          }
        }
      })
      
      // Transfers: vom Quellkonto abziehen, zum Zielkonto hinzufügen
      transfers.forEach((transfer) => {
        if (transfer.fromAccountId === account.id) {
          balance -= Number(transfer.amount)
        }
        if (transfer.toAccountId === account.id) {
          balance += Number(transfer.amount)
        }
      })
    } else {
      // Für Rückstellungskonten: InitialBalance + Summe aller Reserve-Transaktionen
      reserves.forEach((r) => {
        if (r.accountId === account.id) {
          balance += Number(r.amount) // Positiv = Bildung, Negativ = Auflösung
        }
      })
    }
    
    return { ...account, balance }
  })

  return accountBalances
}

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const month = await getCurrentMonth(session.user.id)
  if (!month) {
    return (
      <div>
        <p>Kein Monat gefunden. Bitte erstellen Sie einen Monat.</p>
      </div>
    )
  }

  const accounts = await getAccountsWithBalances(session.user.id, month.id)

  // Berechne KPIs
  const bookedTransactions = month.transactions.filter(
    (t) => t.status === TransactionStatus.BOOKED
  )
  const income = bookedTransactions
    .filter((t) => t.transactionType === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const expenses = bookedTransactions
    .filter((t) => t.transactionType === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  // Rückstellungen: Summe aller Reserve-Transaktionen (positiv = Bildung, negativ = Auflösung)
  const reserves = month.reserves
    .filter((r) => r.status === TransactionStatus.BOOKED)
    .reduce((sum, r) => sum + Number(r.amount), 0)
  
  // Cashflow = Einnahmen - Ausgaben - Rückstellungen
  const netCashflow = income - expenses - reserves

  const plannedIncome = month.transactions
    .filter((t) => t.status === TransactionStatus.PLANNED && t.transactionType === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const plannedExpenses = month.transactions
    .filter((t) => t.status === TransactionStatus.PLANNED && t.transactionType === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Gruppiere Accounts nach Gruppen
  const liquidAccounts = accounts.filter((a) => a.group.code === "LIQUID")
  const investmentAccounts = accounts.filter((a) => a.group.code === "INVESTMENT")
  const reserveAccounts = accounts.filter((a) => a.group.code === "RESERVE")

  const liquidTotal = liquidAccounts.reduce((sum, a) => sum + a.balance, 0)
  const investmentTotal = investmentAccounts.reduce((sum, a) => sum + a.balance, 0)
  const reserveTotal = reserveAccounts.reduce((sum, a) => sum + a.balance, 0)
  // Nettovermögen = Summe aller Konten - Rückstellungen
  const totalNetWorth = liquidTotal + investmentTotal - reserveTotal

  // Letzte Buchungen
  const recentTransactions = month.transactions.slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Monats-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {formatMonthYear(month.month, month.year)}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Status: {month.status === "OPEN" ? "Offen" : "Geschlossen"}
          </p>
        </div>
        <div className="flex gap-2">
          <CreateReserveDialog 
            userId={session.user.id} 
            monthId={month.id} 
            reserveAccounts={reserveAccounts} 
          />
          <Link href="/reserves">
            <Button variant="outline">Alle Rückstellungen</Button>
          </Link>
        </div>
      </div>

      {/* KPI-Kacheln */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Einnahmen (Ist)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 tabular-nums">
              {formatCurrency(income)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ausgaben (Ist)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 tabular-nums">
              {formatCurrency(expenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Netto-Cashflow (Ist)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${netCashflow >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netCashflow)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offene Buchungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Einnahmen:</span> {formatCurrency(plannedIncome)}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Ausgaben:</span> {formatCurrency(plannedExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kontenübersicht - Karten */}
      <div className="space-y-6">
        {/* Liquide Mittel */}
        {liquidAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Liquide Mittel</CardTitle>
              <CardDescription>Übersicht der liquiden Konten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {liquidAccounts.map((account) => (
                  <div key={account.id} className="rounded-lg border border-border/40 bg-background/50 p-5 transition-all duration-200 hover:border-border/60 hover:shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground mb-2">{account.name}</div>
                    <div className="text-xl font-bold tabular-nums">
                      {formatCurrency(account.balance)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-border/40 pt-6">
                <div className="flex justify-between text-base font-semibold tabular-nums">
                  <span>Summe</span>
                  <span>{formatCurrency(liquidTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kapitalanlagen */}
        {investmentAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Kapitalanlagen</CardTitle>
              <CardDescription>Übersicht der Anlagekonten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {investmentAccounts.map((account) => (
                  <div key={account.id} className="rounded-lg border border-border/40 bg-background/50 p-5 transition-all duration-200 hover:border-border/60 hover:shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground mb-2">{account.name}</div>
                    <div className="text-xl font-bold tabular-nums">
                      {formatCurrency(account.balance)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-border/40 pt-6">
                <div className="flex justify-between text-base font-semibold tabular-nums">
                  <span>Summe</span>
                  <span>{formatCurrency(investmentTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rückstellungen */}
        {reserveAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rückstellungen</CardTitle>
              <CardDescription>Übersicht der Rückstellungskonten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {reserveAccounts.map((account) => (
                  <div key={account.id} className="rounded-lg border border-border/40 bg-background/50 p-5 transition-all duration-200 hover:border-border/60 hover:shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground mb-2">{account.name}</div>
                    <div className="text-xl font-bold tabular-nums">
                      {formatCurrency(account.balance)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-border/40 pt-6">
                <div className="flex justify-between text-base font-semibold tabular-nums">
                  <span>Summe</span>
                  <span>{formatCurrency(reserveTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gesamtvermögen */}
        <Card>
          <CardHeader>
            <CardTitle>Gesamtvermögen</CardTitle>
            <CardDescription>Summe aller Konten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(totalNetWorth)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Letzte Buchungen */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Buchungen</CardTitle>
          <CardDescription>Die letzten Transaktionen im aktuellen Monat</CardDescription>
        </CardHeader>
            <CardContent>
              {/* Desktop/Tablet: Tabellenansicht */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Konto</TableHead>
                      <TableHead>Bezeichnung</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Keine Transaktionen gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString("de-DE")}
                          </TableCell>
                          <TableCell>{transaction.account.name}</TableCell>
                          <TableCell className="font-medium">{transaction.name || "-"}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell className={`text-right ${transaction.transactionType === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                            {transaction.transactionType === "INCOME" ? "+" : "-"}
                            {formatCurrency(Number(transaction.amount))}
                          </TableCell>
                          <TableCell>
                            <span className={`rounded px-2 py-1 text-xs ${transaction.status === "BOOKED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                              {transaction.status === "BOOKED" ? "Ist" : "Geplant"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: Card-Ansicht */}
              <div className="md:hidden space-y-3">
                {recentTransactions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Keine Transaktionen gefunden
                  </div>
                ) : (
                  recentTransactions.map((transaction) => (
                    <Card key={transaction.id} className="p-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-base mb-1">{transaction.name || transaction.category}</div>
                            {transaction.name && (
                              <div className="text-sm text-muted-foreground mb-1">{transaction.category}</div>
                            )}
                            <div className="text-sm text-muted-foreground">{transaction.account.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {new Date(transaction.date).toLocaleDateString("de-DE")}
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${transaction.transactionType === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                            {transaction.transactionType === "INCOME" ? "+" : "-"}
                            {formatCurrency(Number(transaction.amount))}
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <span className={`rounded px-2 py-1 text-xs ${transaction.status === "BOOKED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {transaction.status === "BOOKED" ? "Ist" : "Geplant"}
                          </span>
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





