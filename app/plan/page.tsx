import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatMonthYear } from "@/lib/formatters"
import { CreatePlanDialog } from "@/components/plan/create-plan-dialog"

async function getPlanSnapshots(userId: string) {
  return await prisma.planSnapshot.findMany({
    where: { userId },
    orderBy: [
      { year: "asc" },
      { month: "asc" },
    ],
  })
}

async function calculateActualNetWorth(userId: string, year: number, month: number) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      group: true,
    },
  })

  // Hole alle Monate bis zum gewünschten Monat
  const months = await prisma.month.findMany({
    where: {
      userId,
      OR: [
        { year: { lt: year } },
        { year, month: { lte: month } },
      ],
    },
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
    orderBy: [
      { year: "asc" },
      { month: "asc" },
    ],
  })

  // Berechne Salden
  const accountBalances = new Map<string, number>()
  accounts.forEach((acc) => {
    accountBalances.set(acc.id, Number(acc.initialBalance || 0))
  })

  months.forEach((m) => {
    // Transaktionen
    m.transactions.forEach((t) => {
      const current = accountBalances.get(t.accountId) || 0
      if (t.transactionType === "INCOME") {
        accountBalances.set(t.accountId, current + Number(t.amount))
      } else {
        accountBalances.set(t.accountId, current - Number(t.amount))
      }
    })
    
    // Transfers: vom Quellkonto abziehen, zum Zielkonto hinzufügen
    m.transfers.forEach((transfer) => {
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

  return liquidAssets + investments + reserves
}

export default async function PlanPage() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const planSnapshots = await getPlanSnapshots(session.user.id)

  // Berechne Ist-Werte für jeden Plan
  const plansWithActual = await Promise.all(
    planSnapshots.map(async (plan) => {
      const actual = await calculateActualNetWorth(
        session.user.id,
        plan.year,
        plan.month
      )
      const difference = actual - Number(plan.plannedNetWorth)
      const percentage = Number(plan.plannedNetWorth) !== 0
        ? (difference / Number(plan.plannedNetWorth)) * 100
        : 0

      return {
        ...plan,
        actualNetWorth: actual,
        difference,
        percentage,
      }
    })
  )

  // Berechne Zins/Performance
  const plansWithPerformance = plansWithActual.map((plan, index) => {
    if (index === 0) {
      return {
        ...plan,
        monthlyGrowth: 0,
        cumulativeGrowth: 0,
        annualizedGrowth: 0,
      }
    }

    const prevPlan = plansWithActual[index - 1]
    const prevActual = prevPlan.actualNetWorth
    const currentActual = plan.actualNetWorth

    const monthlyGrowth = prevActual !== 0
      ? ((currentActual - prevActual) / prevActual) * 100
      : 0

    const firstPlan = plansWithActual[0]
    const cumulativeGrowth = firstPlan.actualNetWorth !== 0
      ? ((currentActual - firstPlan.actualNetWorth) / firstPlan.actualNetWorth) * 100
      : 0

    // Berechne Anzahl der Monate seit dem ersten Plan
    const monthsDiff =
      (plan.year - firstPlan.year) * 12 + (plan.month - firstPlan.month)
    const annualizedGrowth =
      monthsDiff > 0
        ? (Math.pow(currentActual / firstPlan.actualNetWorth, 12 / monthsDiff) - 1) * 100
        : 0

    return {
      ...plan,
      monthlyGrowth,
      cumulativeGrowth,
      annualizedGrowth,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan vs. Ist</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Vergleich von geplanten und tatsächlichen Vermögenswerten
          </p>
        </div>
        <CreatePlanDialog userId={session.user.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan vs. Ist Übersicht</CardTitle>
          <CardDescription>
            Vergleich der geplanten und tatsächlichen Vermögenswerte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monat</TableHead>
                  <TableHead className="text-right">Geplant</TableHead>
                  <TableHead className="text-right">Ist</TableHead>
                  <TableHead className="text-right">Differenz</TableHead>
                  <TableHead className="text-right">Zins/Monat</TableHead>
                  <TableHead className="text-right">Zins kumuliert</TableHead>
                  <TableHead className="text-right">Zins/Jahr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plansWithPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Keine Plan-Daten gefunden. Erstellen Sie einen Plan.
                    </TableCell>
                  </TableRow>
                ) : (
                  plansWithPerformance.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {formatMonthYear(plan.month, plan.year)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(plan.plannedNetWorth))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(plan.actualNetWorth)}
                      </TableCell>
                      <TableCell
                        className={`text-right ${plan.difference >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {plan.difference >= 0 ? "+" : ""}
                        {formatCurrency(plan.difference)}
                        <div className="text-xs text-muted-foreground">
                          ({plan.percentage >= 0 ? "+" : ""}
                          {plan.percentage.toFixed(2)}%)
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {plan.monthlyGrowth >= 0 ? "+" : ""}
                        {plan.monthlyGrowth.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {plan.cumulativeGrowth >= 0 ? "+" : ""}
                        {plan.cumulativeGrowth.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {plan.annualizedGrowth >= 0 ? "+" : ""}
                        {plan.annualizedGrowth.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





