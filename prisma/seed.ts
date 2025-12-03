import { PrismaClient, TransactionType, TransactionStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starte Seed...")

  // 1. User anlegen
  const passwordHash = await bcrypt.hash("test123", 10)
  const user = await prisma.user.upsert({
    where: { name: "Alex" },
    update: {},
    create: {
      name: "Alex",
      passwordHash,
    },
  })

  console.log("User erstellt:", user.name)

  // 2. Account Types anlegen
  try {
    await prisma.accountType.deleteMany({
      where: { userId: user.id },
    })
  } catch (error) {
    // Tabellen existieren möglicherweise noch nicht
    console.log("Account Types Tabelle existiert noch nicht oder ist leer")
  }

  const accountTypes = await Promise.all([
    prisma.accountType.upsert({
      where: { userId_code: { userId: user.id, code: "CHECKING" } },
      update: {},
      create: {
        userId: user.id,
        name: "Girokonto",
        code: "CHECKING",
      },
    }),
    prisma.accountType.upsert({
      where: { userId_code: { userId: user.id, code: "SAVINGS" } },
      update: {},
      create: {
        userId: user.id,
        name: "Tagesgeld",
        code: "SAVINGS",
      },
    }),
    prisma.accountType.upsert({
      where: { userId_code: { userId: user.id, code: "BROKERAGE" } },
      update: {},
      create: {
        userId: user.id,
        name: "Depot",
        code: "BROKERAGE",
      },
    }),
    prisma.accountType.upsert({
      where: { userId_code: { userId: user.id, code: "CASH" } },
      update: {},
      create: {
        userId: user.id,
        name: "Bargeld",
        code: "CASH",
      },
    }),
    prisma.accountType.upsert({
      where: { userId_code: { userId: user.id, code: "RESERVE" } },
      update: {},
      create: {
        userId: user.id,
        name: "Rückstellung",
        code: "RESERVE",
      },
    }),
    prisma.accountType.upsert({
      where: { userId_code: { userId: user.id, code: "OTHER" } },
      update: {},
      create: {
        userId: user.id,
        name: "Sonstiges",
        code: "OTHER",
      },
    }),
  ])

  console.log(`${accountTypes.length} Kontotypen erstellt`)

  // 3. Account Groups anlegen
  try {
    await prisma.accountGroup.deleteMany({
      where: { userId: user.id },
    })
  } catch (error) {
    // Tabellen existieren möglicherweise noch nicht
    console.log("Account Groups Tabelle existiert noch nicht oder ist leer")
  }

  const accountGroups = await Promise.all([
    prisma.accountGroup.upsert({
      where: { userId_code: { userId: user.id, code: "LIQUID" } },
      update: {},
      create: {
        userId: user.id,
        name: "Liquide Mittel",
        code: "LIQUID",
      },
    }),
    prisma.accountGroup.upsert({
      where: { userId_code: { userId: user.id, code: "INVESTMENT" } },
      update: {},
      create: {
        userId: user.id,
        name: "Kapitalanlagen",
        code: "INVESTMENT",
      },
    }),
    prisma.accountGroup.upsert({
      where: { userId_code: { userId: user.id, code: "RESERVE" } },
      update: {},
      create: {
        userId: user.id,
        name: "Rückstellungen",
        code: "RESERVE",
      },
    }),
    prisma.accountGroup.upsert({
      where: { userId_code: { userId: user.id, code: "LIABILITY" } },
      update: {},
      create: {
        userId: user.id,
        name: "Verbindlichkeiten",
        code: "LIABILITY",
      },
    }),
  ])

  console.log(`${accountGroups.length} Kontogruppen erstellt`)

  // 4. Accounts anlegen (lösche alte Accounts für sauberen Seed)
  await prisma.account.deleteMany({
    where: { userId: user.id },
  })

  const checkingType = accountTypes.find((t) => t.code === "CHECKING")!
  const savingsType = accountTypes.find((t) => t.code === "SAVINGS")!
  const brokerageType = accountTypes.find((t) => t.code === "BROKERAGE")!
  const cashType = accountTypes.find((t) => t.code === "CASH")!
  const reserveType = accountTypes.find((t) => t.code === "RESERVE")!

  const liquidGroup = accountGroups.find((g) => g.code === "LIQUID")!
  const investmentGroup = accountGroups.find((g) => g.code === "INVESTMENT")!
  const reserveGroup = accountGroups.find((g) => g.code === "RESERVE")!

  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        userId: user.id,
        name: "ING-DiBa Gemeinschaftskonto",
        typeId: checkingType.id,
        groupId: liquidGroup.id,
        initialBalance: 5000,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "ING-DiBa Tagesgeld",
        typeId: savingsType.id,
        groupId: liquidGroup.id,
        initialBalance: 10000,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Bitpanda",
        typeId: brokerageType.id,
        groupId: investmentGroup.id,
        initialBalance: 15000,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Stuttgarter flexible Privatvorsorge",
        typeId: brokerageType.id,
        groupId: investmentGroup.id,
        initialBalance: 8000,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Rückstellung Steuern",
        typeId: reserveType.id,
        groupId: reserveGroup.id,
        initialBalance: 2000,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Rückstellung Auto",
        typeId: reserveType.id,
        groupId: reserveGroup.id,
        initialBalance: 1500,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Rückstellung Nebenkosten",
        typeId: reserveType.id,
        groupId: reserveGroup.id,
        initialBalance: 1000,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Tresor",
        typeId: cashType.id,
        groupId: liquidGroup.id,
        initialBalance: 500,
      },
    }),
  ])

  console.log(`${accounts.length} Accounts erstellt`)

  // 3. Aktuellen Monat anlegen (lösche alte Monate für sauberen Seed)
  await prisma.month.deleteMany({
    where: { userId: user.id },
  })

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const month = await prisma.month.create({
    data: {
      userId: user.id,
      year: currentYear,
      month: currentMonth,
      status: "OPEN",
    },
  })

  console.log(`Monat erstellt: ${currentMonth}/${currentYear}`)

  // 4. Beispiel-Transactions und Transfers (lösche alte Daten)
  await prisma.transaction.deleteMany({
    where: { userId: user.id },
  })
  await prisma.transfer.deleteMany({
    where: { userId: user.id },
  })

  const giroAccount = accounts[0]
  const tagesgeldAccount = accounts[1]
  const bitpandaAccount = accounts[2]
  const steuerReserve = accounts[4]

  const transactions = await Promise.all([
    // Gehalt
    prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: giroAccount.id,
        monthId: month.id,
        date: new Date(currentYear, currentMonth - 1, 1),
        amount: 3500,
        transactionType: TransactionType.INCOME,
        status: TransactionStatus.BOOKED,
        category: "Gehalt",
        notes: "Monatliches Gehalt",
      },
    }),
    // Miete
    prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: giroAccount.id,
        monthId: month.id,
        date: new Date(currentYear, currentMonth - 1, 3),
        amount: 1200,
        transactionType: TransactionType.EXPENSE,
        status: TransactionStatus.BOOKED,
        category: "Miete",
      },
    }),
    // Strom
    prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: giroAccount.id,
        monthId: month.id,
        date: new Date(currentYear, currentMonth - 1, 5),
        amount: 80,
        transactionType: TransactionType.EXPENSE,
        status: TransactionStatus.BOOKED,
        category: "Strom",
      },
    }),
    // Internet
    prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: giroAccount.id,
        monthId: month.id,
        date: new Date(currentYear, currentMonth - 1, 6),
        amount: 40,
        transactionType: TransactionType.EXPENSE,
        status: TransactionStatus.BOOKED,
        category: "Internet",
      },
    }),
    // Streaming
    prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: giroAccount.id,
        monthId: month.id,
        date: new Date(currentYear, currentMonth - 1, 7),
        amount: 15,
        transactionType: TransactionType.EXPENSE,
        status: TransactionStatus.BOOKED,
        category: "Streaming",
      },
    }),
    // Offene Buchung (PLANNED)
    prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: giroAccount.id,
        monthId: month.id,
        date: new Date(currentYear, currentMonth - 1, 25),
        amount: 150,
        transactionType: TransactionType.EXPENSE,
        status: TransactionStatus.PLANNED,
        category: "Lebensmittel",
        notes: "Noch nicht gebucht",
      },
    }),
  ])

  // Transfers erstellen (separat von Transactions)
  const transfers = await Promise.all([
    // Steuer-Rücklage Transfer
    prisma.transfer.create({
      data: {
        userId: user.id,
        fromAccountId: giroAccount.id,
        toAccountId: steuerReserve.id,
        monthId: month.id,
        date: new Date(currentYear, currentMonth - 1, 10),
        amount: 300,
        status: TransactionStatus.BOOKED,
        category: "Steuer-Rücklage",
        notes: "Transfer zu Rückstellung Steuern",
      },
    }),
    // ETF-Sparplan Transfer
    prisma.transfer.create({
      data: {
        userId: user.id,
        fromAccountId: giroAccount.id,
        toAccountId: bitpandaAccount.id,
        monthId: month.id,
        date: new Date(currentYear, currentMonth - 1, 15),
        amount: 500,
        status: TransactionStatus.BOOKED,
        category: "ETF-Sparplan",
        notes: "Transfer zu Bitpanda",
      },
    }),
  ])

  console.log(`${transactions.length} Transaktionen erstellt`)
  console.log(`${transfers.length} Transfers erstellt`)

  // 5. WealthSnapshot für aktuellen Monat (lösche alte Snapshots)
  await prisma.wealthSnapshot.deleteMany({
    where: { userId: user.id },
  })

  // Berechne aktuelle Salden aus Transactions und Transfers
  const bookedTransactions = transactions.filter((t) => t.status === TransactionStatus.BOOKED)
  const bookedTransfers = transfers.filter((t) => t.status === TransactionStatus.BOOKED)
  const accountBalances = new Map<string, number>()

  accounts.forEach((acc) => {
    let balance = Number(acc.initialBalance)
    
    // Transaktionen
    bookedTransactions.forEach((t) => {
      if (t.accountId === acc.id) {
        if (t.transactionType === TransactionType.INCOME) {
          balance += Number(t.amount)
        } else {
          balance -= Number(t.amount)
        }
      }
    })
    
    // Transfers: vom Quellkonto abziehen, zum Zielkonto hinzufügen
    bookedTransfers.forEach((transfer) => {
      if (transfer.fromAccountId === acc.id) {
        balance -= Number(transfer.amount)
      }
      if (transfer.toAccountId === acc.id) {
        balance += Number(transfer.amount)
      }
    })
    
    accountBalances.set(acc.id, balance)
  })

  // Lade Accounts mit Gruppen für Berechnung
  const accountsWithGroups = await prisma.account.findMany({
    where: { userId: user.id },
    include: { group: true },
  })

  const currentLiquid = accountsWithGroups
    .filter((a) => a.group.code === "LIQUID")
    .reduce((sum, a) => sum + (accountBalances.get(a.id) || 0), 0)
  const currentInvestments = accountsWithGroups
    .filter((a) => a.group.code === "INVESTMENT")
    .reduce((sum, a) => sum + (accountBalances.get(a.id) || 0), 0)
  const currentReserves = accountsWithGroups
    .filter((a) => a.group.code === "RESERVE")
    .reduce((sum, a) => sum + (accountBalances.get(a.id) || 0), 0)

  await prisma.wealthSnapshot.create({
    data: {
      userId: user.id,
      date: new Date(currentYear, currentMonth - 1, 28),
      totalNetWorth: currentLiquid + currentInvestments + currentReserves,
      liquidAssets: currentLiquid,
      investments: currentInvestments,
      reserves: currentReserves,
      liabilities: 0,
    },
  })

  console.log("WealthSnapshot erstellt")
  console.log("Seed abgeschlossen!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

