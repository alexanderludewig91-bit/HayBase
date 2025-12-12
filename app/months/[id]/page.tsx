import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionStatus } from "@prisma/client"
import { formatCurrency, formatMonthYear } from "@/lib/formatters"

async function getMonth(userId: string, monthId: string) {
  const month = await prisma.month.findFirst({
    where: {
      id: monthId,
      userId,
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
    },
  })

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

  const [transactions, transfers] = await Promise.all([
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
  ])

  const accountBalances = accounts.map((account) => {
    let balance = Number(account.initialBalance || 0)
    
    // Transaktionen
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
    
    return { ...account, balance }
  })

  return accountBalances
}

export default async function MonthDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const month = await getMonth(session.user.id, params.id)
  if (!month) {
    return (
      <div>
        <p>Monat nicht gefunden.</p>
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
  const netCashflow = income - expenses

  // Gruppiere Accounts nach Gruppen
  const liquidAccounts = accounts.filter((a) => a.group.code === "LIQUID")
  const investmentAccounts = accounts.filter((a) => a.group.code === "INVESTMENT")
  const reserveAccounts = accounts.filter((a) => a.group.code === "RESERVE")

  const liquidTotal = liquidAccounts.reduce((sum, a) => sum + a.balance, 0)
  const investmentTotal = investmentAccounts.reduce((sum, a) => sum + a.balance, 0)
  const reserveTotal = reserveAccounts.reduce((sum, a) => sum + a.balance, 0)
  const totalNetWorth = liquidTotal + investmentTotal + reserveTotal

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {formatMonthYear(month.month, month.year)}
        </h1>
        <p className="text-muted-foreground">
          Status: {month.status === "OPEN" ? "Offen" : "Geschlossen"}
        </p>
      </div>

      {/* KPI-Kacheln */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Einnahmen (Ist)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(income)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausgaben (Ist)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(expenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Netto-Cashflow (Ist)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashflow >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netCashflow)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kontenübersicht */}
      <Card>
        <CardHeader>
          <CardTitle>Kontenübersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {liquidAccounts.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">Liquide Mittel</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Konto</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liquidAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(account.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell>Summe</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(liquidTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            {investmentAccounts.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">Kapitalanlagen</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Konto</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investmentAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(account.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell>Summe</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(investmentTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            {reserveAccounts.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">Rückstellungen</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Konto</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reserveAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(account.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell>Summe</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reserveTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Gesamtvermögen</span>
                <span>{formatCurrency(totalNetWorth)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alle Transaktionen */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Transaktionen</CardTitle>
        </CardHeader>
        <CardContent>
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
              {month.transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Keine Transaktionen gefunden
                  </TableCell>
                </TableRow>
              ) : (
                month.transactions.map((transaction) => (
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
        </CardContent>
      </Card>
    </div>
  )
}





