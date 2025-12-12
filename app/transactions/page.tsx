import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionStatus } from "@prisma/client"
import { formatCurrency } from "@/lib/formatters"
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import { CreateTransactionDialog } from "@/components/transactions/create-transaction-dialog"
import { CreateTransferDialog } from "@/components/transactions/create-transfer-dialog"
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog"
import { DeleteTransactionButton } from "@/components/transactions/delete-transaction-button"
import { DeleteTransferButton } from "@/components/transactions/delete-transfer-button"

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

async function getTransactions(
  userId: string,
  monthId: string | null,
  filters: {
    accountId?: string
    status?: string
    transactionType?: string
  }
) {
  if (!monthId) {
    return { transactions: [], transfers: [] }
  }

  const transactionWhere: any = {
    userId,
    monthId,
  }

  if (filters.accountId) {
    transactionWhere.accountId = filters.accountId
  }
  if (filters.status) {
    transactionWhere.status = filters.status
  }
  if (filters.transactionType) {
    transactionWhere.transactionType = filters.transactionType
  }

  const transferWhere: any = {
    userId,
    monthId,
  }

  if (filters.status) {
    transferWhere.status = filters.status
  }
  if (filters.accountId) {
    transferWhere.OR = [
      { fromAccountId: filters.accountId },
      { toAccountId: filters.accountId },
    ]
  }

  const [transactions, transfers] = await Promise.all([
    prisma.transaction.findMany({
      where: transactionWhere,
      include: {
        account: true,
        month: true,
      },
      orderBy: {
        date: "desc",
      },
    }),
    prisma.transfer.findMany({
      where: transferWhere,
      include: {
        fromAccount: true,
        toAccount: true,
        month: true,
      },
      orderBy: {
        date: "desc",
      },
    }),
  ])

  return { transactions, transfers }
}

async function getAccounts(userId: string) {
  return await prisma.account.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  })
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { accountId?: string; status?: string; transactionType?: string }
}) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const month = await getCurrentMonth(session.user.id)
  const accounts = await getAccounts(session.user.id)

  const { transactions, transfers } = await getTransactions(session.user.id, month?.id || null, {
    accountId: searchParams.accountId,
    status: searchParams.status,
    transactionType: searchParams.transactionType,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaktionen</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {month
              ? `Transaktionen für ${month.month}/${month.year}`
              : "Kein Monat gefunden"}
          </p>
        </div>
        {month && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <CreateTransactionDialog userId={session.user.id} monthId={month.id} accounts={accounts} />
            <CreateTransferDialog userId={session.user.id} monthId={month.id} accounts={accounts} />
          </div>
        )}
      </div>

      {month && (
        <>
          <TransactionFilters accounts={accounts} />
          <Card>
            <CardHeader>
              <CardTitle>Transaktionsliste</CardTitle>
              <CardDescription>
                {transactions.length} Transaktion(en) und {transfers.length} Umbuchung(en) gefunden
              </CardDescription>
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
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 && transfers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Keine Transaktionen gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {transactions.map((transaction) => (
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
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <EditTransactionDialog
                                  transaction={transaction}
                                  accounts={accounts}
                                />
                                <DeleteTransactionButton transactionId={transaction.id} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {transfers.map((transfer) => (
                          <TableRow key={transfer.id} className="bg-blue-50">
                            <TableCell>
                              {new Date(transfer.date).toLocaleDateString("de-DE")}
                            </TableCell>
                            <TableCell>
                              {transfer.fromAccount.name} → {transfer.toAccount.name}
                            </TableCell>
                            <TableCell>{transfer.category}</TableCell>
                            <TableCell className="text-right text-blue-600">
                              {formatCurrency(Number(transfer.amount))}
                            </TableCell>
                            <TableCell>
                              <span className={`rounded px-2 py-1 text-xs ${transfer.status === "BOOKED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                {transfer.status === "BOOKED" ? "Ist" : "Geplant"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <DeleteTransferButton transferId={transfer.id} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: Card-Ansicht */}
              <div className="md:hidden space-y-3">
                {transactions.length === 0 && transfers.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="text-sm">Keine Transaktionen gefunden</p>
                  </div>
                ) : (
                  <>
                    {transactions.map((transaction) => (
                      <Card key={transaction.id} className="overflow-hidden">
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-base mb-1.5 truncate">{transaction.name || transaction.category}</div>
                              {transaction.name && (
                                <div className="text-sm text-muted-foreground mb-1">{transaction.category}</div>
                              )}
                              <div className="text-sm text-muted-foreground mb-1">{transaction.account.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric"
                                })}
                              </div>
                            </div>
                            <div className={`text-lg font-bold tabular-nums shrink-0 ${transaction.transactionType === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                              {transaction.transactionType === "INCOME" ? "+" : "-"}
                              {formatCurrency(Number(transaction.amount))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border/50">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${transaction.status === "BOOKED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                              {transaction.status === "BOOKED" ? "Ist" : "Geplant"}
                            </span>
                            <div className="flex gap-2">
                              <EditTransactionDialog
                                transaction={transaction}
                                accounts={accounts}
                              />
                              <DeleteTransactionButton transactionId={transaction.id} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {transfers.map((transfer) => (
                      <Card key={transfer.id} className="overflow-hidden bg-blue-50/50 border-blue-200/50">
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-base mb-1.5 truncate">{transfer.category}</div>
                              <div className="text-sm text-muted-foreground mb-1">
                                <span className="font-medium">{transfer.fromAccount.name}</span>
                                <span className="mx-1.5">→</span>
                                <span className="font-medium">{transfer.toAccount.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(transfer.date).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric"
                                })}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-blue-600 tabular-nums shrink-0">
                              {formatCurrency(Number(transfer.amount))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-blue-200/50">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${transfer.status === "BOOKED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                              {transfer.status === "BOOKED" ? "Ist" : "Geplant"}
                            </span>
                            <div className="flex gap-2">
                              <DeleteTransferButton transferId={transfer.id} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}





