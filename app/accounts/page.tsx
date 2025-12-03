import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/formatters"
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog"
import { EditAccountDialog } from "@/components/accounts/edit-account-dialog"
import { DeleteAccountButton } from "@/components/accounts/delete-account-button"
import { CreateAccountTypeDialog } from "@/components/settings/create-account-type-dialog"
import { EditAccountTypeDialog } from "@/components/settings/edit-account-type-dialog"
import { DeleteAccountTypeButton } from "@/components/settings/delete-account-type-button"
import { CreateAccountGroupDialog } from "@/components/settings/create-account-group-dialog"
import { EditAccountGroupDialog } from "@/components/settings/edit-account-group-dialog"
import { DeleteAccountGroupButton } from "@/components/settings/delete-account-group-button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

async function getAccounts(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      type: true,
      group: true,
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: [
      { group: { name: "asc" } },
      { name: "asc" },
    ],
  })

  // Zähle auch Transfers für jedes Konto (sowohl von als auch zu)
  const accountIds = accounts.map((a) => a.id)
  const transfers = await prisma.transfer.findMany({
    where: {
      userId,
      OR: [
        { fromAccountId: { in: accountIds } },
        { toAccountId: { in: accountIds } },
      ],
    },
    select: {
      fromAccountId: true,
      toAccountId: true,
    },
  })

  // Erstelle Map für Transfer-Zählung
  const transferCounts = new Map<string, number>()
  accounts.forEach((account) => {
    transferCounts.set(account.id, 0)
  })

  transfers.forEach((transfer) => {
    // Zähle Transfer für Quellkonto
    const fromCount = transferCounts.get(transfer.fromAccountId) || 0
    transferCounts.set(transfer.fromAccountId, fromCount + 1)
    
    // Zähle Transfer für Zielkonto
    const toCount = transferCounts.get(transfer.toAccountId) || 0
    transferCounts.set(transfer.toAccountId, toCount + 1)
  })

  // Füge Transfer-Anzahl zu jedem Account hinzu
  return accounts.map((account) => ({
    ...account,
    transferCount: transferCounts.get(account.id) || 0,
    totalTransactionCount: account._count.transactions + (transferCounts.get(account.id) || 0),
  }))
}

async function getAccountTypes(userId: string) {
  return await prisma.accountType.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          accounts: true,
        },
      },
    },
  })
}

async function getAccountGroups(userId: string) {
  return await prisma.accountGroup.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          accounts: true,
        },
      },
    },
  })
}

export default async function AccountsPage() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [accounts, accountTypes, accountGroups] = await Promise.all([
    getAccounts(session.user.id),
    getAccountTypes(session.user.id),
    getAccountGroups(session.user.id),
  ])

  // Debug: Log für Entwicklung
  if (process.env.NODE_ENV === "development") {
    console.log("Session User ID:", session.user.id)
    console.log("Accounts geladen:", accounts.length)
    
    // Prüfe alle User in der DB
    const allUsers = await prisma.user.findMany()
    console.log("Alle User in DB:", allUsers.map(u => ({ id: u.id, name: u.name })))
    
    // Prüfe Accounts für alle User
    const allAccounts = await prisma.account.findMany({
      include: { type: true, group: true }
    })
    console.log("Alle Accounts in DB:", allAccounts.length)
    if (allAccounts.length > 0) {
      console.log("Erstes Account (alle):", {
        id: allAccounts[0].id,
        userId: allAccounts[0].userId,
        name: allAccounts[0].name,
      })
    }
  }

  // Gruppiere Accounts nach Gruppen
  const accountsByGroup = accounts.reduce((acc, account) => {
    // Sicherheitscheck: Falls Relationen nicht geladen wurden
    if (!account.group) {
      console.error("Account ohne Gruppe:", account.id, account)
      return acc
    }
    const groupName = account.group.name
    if (!acc[groupName]) {
      acc[groupName] = []
    }
    acc[groupName].push(account)
    return acc
  }, {} as Record<string, typeof accounts>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Konten & Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-2">Verwaltung von Konten, Typen und Gruppen</p>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList>
          <TabsTrigger value="accounts">Konten</TabsTrigger>
          <TabsTrigger value="types">Kontotypen</TabsTrigger>
          <TabsTrigger value="groups">Kontogruppen</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-xl font-semibold">Konten</h2>
              <p className="text-sm text-muted-foreground mt-2">Verwaltung aller Konten</p>
            </div>
            <CreateAccountDialog userId={session.user.id} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kontenübersicht</CardTitle>
              <CardDescription>
                Alle Konten nach Gruppen sortiert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(accountsByGroup).map(([groupName, groupAccounts]) => (
                  <div key={groupName}>
                    <h3 className="mb-3 sm:mb-2 text-base sm:text-lg font-semibold">{groupName}</h3>
                    {/* Desktop/Tablet: Tabellenansicht */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Typ</TableHead>
                            <TableHead className="text-right">Startsaldo</TableHead>
                            <TableHead className="text-right">Transaktionen</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupAccounts.map((account) => (
                            <TableRow key={account.id}>
                              <TableCell className="font-medium">{account.name}</TableCell>
                              <TableCell>{account.type?.name || "Unbekannt"}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(Number(account.initialBalance || 0))}
                              </TableCell>
                              <TableCell className="text-right">
                                {account.totalTransactionCount}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <EditAccountDialog account={account} />
                                  <DeleteAccountButton accountId={account.id} transactionCount={account.totalTransactionCount} />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile: Card-Ansicht */}
                    <div className="md:hidden space-y-3">
                      {groupAccounts.map((account) => (
                        <Card key={account.id} className="overflow-hidden">
                          <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-base mb-1.5 truncate">{account.name}</div>
                                <div className="text-sm text-muted-foreground">{account.type?.name || "Unbekannt"}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1.5">Startsaldo</div>
                                <div className="text-sm font-semibold tabular-nums">{formatCurrency(Number(account.initialBalance || 0))}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1.5">Transaktionen</div>
                                <div className="text-sm font-semibold">{account.totalTransactionCount}</div>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                              <EditAccountDialog account={account} />
                              <DeleteAccountButton accountId={account.id} transactionCount={account.totalTransactionCount} />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}

                {accounts.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Keine Konten gefunden. Erstellen Sie ein neues Konto.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Kontotypen</h2>
              <p className="text-muted-foreground">Verwalten Sie die verfügbaren Kontotypen</p>
            </div>
            <CreateAccountTypeDialog userId={session.user.id} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kontotypen</CardTitle>
              <CardDescription>
                Verwalten Sie die verfügbaren Kontotypen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Verwendet in</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Keine Kontotypen gefunden
                      </TableCell>
                    </TableRow>
                  ) : (
                    accountTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell className="text-muted-foreground">{type.code}</TableCell>
                        <TableCell className="text-right">
                          {type._count.accounts} Konto(en)
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <EditAccountTypeDialog accountType={type} />
                            <DeleteAccountTypeButton
                              accountTypeId={type.id}
                              accountCount={type._count.accounts}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Kontogruppen</h2>
              <p className="text-muted-foreground">Verwalten Sie die verfügbaren Kontogruppen</p>
            </div>
            <CreateAccountGroupDialog userId={session.user.id} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kontogruppen</CardTitle>
              <CardDescription>
                Verwalten Sie die verfügbaren Kontogruppen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Verwendet in</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Keine Kontogruppen gefunden
                      </TableCell>
                    </TableRow>
                  ) : (
                    accountGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-muted-foreground">{group.code}</TableCell>
                        <TableCell className="text-right">
                          {group._count.accounts} Konto(en)
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <EditAccountGroupDialog accountGroup={group} />
                            <DeleteAccountGroupButton
                              accountGroupId={group.id}
                              accountCount={group._count.accounts}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

