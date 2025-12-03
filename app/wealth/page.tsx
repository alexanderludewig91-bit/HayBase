import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatMonthYear } from "@/lib/formatters"
import { WealthChart } from "@/components/wealth/wealth-chart"

async function getWealthSnapshots(userId: string) {
  return await prisma.wealthSnapshot.findMany({
    where: { userId },
    orderBy: {
      date: "asc",
    },
  })
}

async function calculateCurrentWealth(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      group: true,
    },
  })

  const months = await prisma.month.findMany({
    where: { userId },
    include: {
      transactions: {
        where: {
          status: "BOOKED",
        },
      },
      transfers: {
        where: {
          status: "BOOKED",
        },
      },
    },
  })

  // Berechne aktuelle Salden
  const accountBalances = new Map<string, number>()
  accounts.forEach((acc) => {
    accountBalances.set(acc.id, Number(acc.initialBalance || 0))
  })

  months.forEach((month) => {
    // Transaktionen
    month.transactions.forEach((t) => {
      const current = accountBalances.get(t.accountId) || 0
      if (t.transactionType === "INCOME") {
        accountBalances.set(t.accountId, current + Number(t.amount))
      } else {
        accountBalances.set(t.accountId, current - Number(t.amount))
      }
    })
    
    // Transfers: vom Quellkonto abziehen, zum Zielkonto hinzufügen
    month.transfers.forEach((transfer) => {
      const fromBalance = accountBalances.get(transfer.fromAccountId) || 0
      const toBalance = accountBalances.get(transfer.toAccountId) || 0
      accountBalances.set(transfer.fromAccountId, fromBalance - Number(transfer.amount))
      accountBalances.set(transfer.toAccountId, toBalance + Number(transfer.amount))
    })
  })

  const liquidAssets = accounts
    .filter((a) => a.group.code === "LIQUID")
    .reduce((sum, a) => sum + (accountBalances.get(a.id) || 0), 0)
  const investments = accounts
    .filter((a) => a.group.code === "INVESTMENT")
    .reduce((sum, a) => sum + (accountBalances.get(a.id) || 0), 0)
  const reserves = accounts
    .filter((a) => a.group.code === "RESERVE")
    .reduce((sum, a) => sum + (accountBalances.get(a.id) || 0), 0)

  return {
    totalNetWorth: liquidAssets + investments + reserves,
    liquidAssets,
    investments,
    reserves,
  }
}

export default async function WealthPage() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const snapshots = await getWealthSnapshots(session.user.id)
  const currentWealth = await calculateCurrentWealth(session.user.id)

  // Kombiniere Snapshots mit aktuellen Werten
  const allData = [
    ...snapshots.map((s) => ({
      date: s.date,
      month: new Date(s.date).getMonth() + 1,
      year: new Date(s.date).getFullYear(),
      totalNetWorth: Number(s.totalNetWorth),
      liquidAssets: Number(s.liquidAssets),
      investments: Number(s.investments),
      reserves: Number(s.reserves),
      isSnapshot: true,
    })),
  ]

  // Füge aktuellen Stand hinzu, falls noch nicht vorhanden
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const hasCurrentMonth = allData.some(
    (d) => d.month === currentMonth && d.year === currentYear
  )

  if (!hasCurrentMonth) {
    allData.push({
      date: now,
      month: currentMonth,
      year: currentYear,
      ...currentWealth,
      isSnapshot: false,
    })
  }

  // Sortiere nach Datum
  allData.sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date)
    const dateB = b.date instanceof Date ? b.date : new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vermögensübersicht</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Entwicklung des Vermögens über die Zeit
        </p>
      </div>

      {/* Aktuelles Vermögen */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtvermögen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(currentWealth.totalNetWorth)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquide Mittel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(currentWealth.liquidAssets)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kapitalanlagen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(currentWealth.investments)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rückstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(currentWealth.reserves)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {allData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vermögensentwicklung</CardTitle>
            <CardDescription>
              Entwicklung des Gesamtvermögens über die Zeit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WealthChart data={allData} />
          </CardContent>
        </Card>
      )}

      {/* Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Vermögenshistorie</CardTitle>
          <CardDescription>
            Monatliche Übersicht des Vermögens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monat</TableHead>
                <TableHead className="text-right">Gesamtvermögen</TableHead>
                <TableHead className="text-right">Liquide Mittel</TableHead>
                <TableHead className="text-right">Kapitalanlagen</TableHead>
                <TableHead className="text-right">Rückstellungen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Keine Daten gefunden
                  </TableCell>
                </TableRow>
              ) : (
                allData.map((item, index) => {
                  const date = item.date instanceof Date ? item.date : new Date(item.date)
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {formatMonthYear(item.month, item.year)}
                        {!item.isSnapshot && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (aktuell)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.totalNetWorth)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.liquidAssets)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.investments)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.reserves)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}





