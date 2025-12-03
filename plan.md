Du bist ein erfahrener Fullstack-Entwickler und Architekt. Baue mir in einem Rutsch einen lauffähigen Prototypen einer Finanz-Webapp namens **DrBalance**.

Ziel:
Ich führe seit Jahren ein sehr detailliertes Haushaltsbuch in Excel. Jeden Monat gibt es ein eigenes Tabellenblatt mit:
- Einnahmen/Ausgaben (Ist + offene Buchungen),
- Kontoübersicht (Giro/Tagesgeld/Depot/Bargeld etc.),
- Rückstellungen (Auto, Versicherung, Steuern, Nebenkosten, Urlaub),
- Sparplänen/Investments,
- Gesamtschau der Kontostände.

Zusätzlich habe ich:
- eine Tabelle mit monatlicher Vermögensübersicht und zur langfristigen Entwicklung (Plan-Cashflow und Vermögen Soll vs. Ist, inkl. „Zins pro Monat / kumuliert / pro Jahr“).

Ich möchte diese Logik als Webapp abbilden, die vor allem für mich funktioniert (später evtl. erweiterbar für andere Nutzer).

### Allgemeine Vorgaben

- Projektname: **DrBalance**
- Initial nur **lokale Entwicklung und Test**. Später soll die App auf Railway deployt werden, deshalb bitte den Code so schreiben, dass das einfach geht.
- Nutze:
  - **Next.js (App Router)**
  - **TypeScript**
  - **Tailwind CSS** + gern shadcn/ui für Komponenten
  - **Prisma** als ORM
  - **Prosgresql** als lokale DB (Standard-Prisma-Konfiguration)
- Auth:
  - Einfache Login-Funktion mit E-Mail + Passwort.
  - Es reicht, wenn ein User existiert, der per Seed-Script angelegt wird (z.B. `Alex` / `test123`).
  - Du kannst entweder NextAuth/Auth.js mit Credentials Provider oder eine einfache eigene Session-Lösung verwenden – Hauptsache: Login-Form, Session-Handling, geschützte Routen, hohe Sicherheit!
- Fokus: **Funktionalität** > Pixelperfektion. UI soll aber gut was her machen.

---

## Domänenmodell / Datenmodell

Baue folgende Kern-Entities mit Prisma:

1. **User**
   - `id`
   - `name`
   - `passwordHash` (für Login)
   - `createdAt`

2. **Account**
   - `id`
   - `userId` → User
   - `name` (z.B. „ING-DiBa Gemeinschaftskonto“, „ING Tagesgeld“, „Bitpanda“, „Stuttgarter“, „Rückstellung Steuern“, „Tresor“)
   - `type` (enum, z.B. `CHECKING`, `SAVINGS`, `BROKERAGE`, `CASH`, `RESERVE`, `OTHER`)
   - `group` (enum oder string, z.B. `LIQUID`, `INVESTMENT`, `RESERVE`, `LIABILITY`)
   - `initialBalance` (Startsaldo, optional)
   - `createdAt`

   Hinweis: Rückstellungen (Auto, Versicherung, Steuern, Nebenkosten, Urlaub) werden als eigene Accounts mit `type=RESERVE` und `group=RESERVE` modelliert.

3. **Month**
   - `id`
   - `userId`
   - `year` (z.B. 2025)
   - `month` (1–12)
   - `status` (enum: `OPEN`, `CLOSED`)
   - `createdAt`

4. **Transaction**
   - `id`
   - `userId`
   - `accountId` → Account
   - `monthId` → Month
   - `date`
   - `amount` (als Decimal; positive Werte, Richtung über Felder unten)
   - `direction` (enum: `INCOME`, `EXPENSE`) – spiegelt deine Einnahmen/Ausgaben-Logik.
   - `transactionType` (enum: `INCOME`, `EXPENSE`, `TRANSFER`)
   - `status` (enum: `BOOKED` = Ist, `PLANNED` = offene Buchung/Soll)
   - `category` (string, z.B. „Miete“, „Strom“, „ETF-Sparplan“, „Steuer-Rücklage“, „Urlaub“)
   - `notes` (optional)
   - `createdAt`

   Wichtig:
   - Über `status` bilden wir „Ist“ und „offene Buchungen“ ab.
   - Transfers zwischen zwei Accounts können später über zwei verknüpfte Transactions abgebildet werden, fürs MVP reicht eine einfache Transaction.

5. **WealthSnapshot**
   - `id`
   - `userId`
   - `date` (typischerweise Monatsende)
   - `totalNetWorth`
   - `liquidAssets`
   - `investments`
   - `reserves`
   - `liabilities` (optional)
   - `createdAt`

   Diese Tabelle dient der Vermögenshistorie.

6. **PlanSnapshot** (für Soll-Werte / Planung)
   - `id`
   - `userId`
   - `year`
   - `month`
   - `plannedNetWorth` (Vermögen Soll)
   - optional: `plannedCashflow`
   - `createdAt`

   Hier liegen die Soll-Werte, mit denen wir später Ist vs. Plan vergleichen und Zins/Performance berechnen.

---

## Seed-Daten

Erstelle ein Seed-Script, das:

1. Einen User anlegt:
   - Benutzername: `Alex`
   - Passwort: `test123` (bcrypt o.ä. gehasht in `passwordHash`)

2. Ein paar Beispiel-Accounts für diesen User:
   - `ING-DiBa Gemeinschaftskonto` (CHECKING, LIQUID)
   - `ING-DiBa Tagesgeld` (SAVINGS, LIQUID)
   - `Bitpanda` (BROKERAGE, INVESTMENT)
   - `Stuttgarter flexible Privatvorsorge` (BROKERAGE/OTHER, INVESTMENT)
   - `Rückstellung Steuern` (RESERVE, RESERVE)
   - `Rückstellung Auto` (RESERVE, RESERVE)
   - `Rückstellung Nebenkosten` (RESERVE, RESERVE)
   - `Tresor` (CASH, LIQUID)

3. Einen aktuellen Monat, z.B. den laufenden Monat/Jahr, als `Month` mit `status=OPEN`.

4. Einige Beispiel-Transactions für diesen Monat, z.B.:
   - Gehalt als `INCOME`, `BOOKED`.
   - Miete, Strom, Internet, Streaming etc. als `EXPENSE`, `BOOKED`.
   - Ein „Steuer-Rücklage“-Betrag als `EXPENSE` aus Girokonto und `INCOME` auf `Rückstellung Steuern` (Transfer; fürs MVP reicht eine Seite).
   - ETF-Sparplan als `EXPENSE` vom Girokonto, `INCOME` auf Bitpanda (oder auch nur simple EXPENSE-Transaktion).

---

## Funktionale Anforderungen (MVP)

Baue bitte mindestens folgende Screens/Pages:

### 1. Login / Auth

- `/login`:
  - Einfaches Formular (Benutzername, Passwort).
  - Bei erfolgreichem Login → Redirect auf `/dashboard`.
- Session-Handling:
  - Geschützte Routen (Dashboard & alles dahinter nur für eingeloggte User).

### 2. Dashboard (Standard-Startseite nach Login)

Route: `/dashboard` (oder `/` mit Redirect)

Anforderungen:
- Zeigt immer den **aktuellen Monat** (z.B. den Eintrag mit `status=OPEN` oder den letzten Monat chronologisch).
- Enthält:

  1. **Monats-Header**
     - Monat + Jahr
     - Status (OPEN/CLOSED)

  2. **KPI-Kacheln** für den Monat:
     - Summe **Einnahmen (Ist)**: Summe aller `Transaction` mit `direction=INCOME` und `status=BOOKED`.
     - Summe **Ausgaben (Ist)**: analog `EXPENSE` und `BOOKED`.
     - **Netto-Cashflow (Ist)** = Einnahmen - Ausgaben.
     - Optional: Summe `PLANNED` (offene Buchungen) für Vorschau.

  3. **Kontenübersicht**
     - Tabelle mit allen Accounts für diesen User.
     - Für jedes Konto:
       - Name
       - aktueller Saldo im Monat = (Startsaldo oder 0) + Summe `BOOKED`-Transactions (Einnahmen positiv, Ausgaben negativ). Du kannst für das MVP davon ausgehen, dass der Saldostand sich nur aus den Transactions ergibt.
       - Gruppierung nach `group` (liquide Mittel, Kapitalanlagen, Rückstellungen).
     - Summenzeilen:
       - Summe liquide Mittel
       - Summe Kapitalanlagen
       - Summe Rückstellungen
       - Gesamtvermögen (liquide + Kapitalanlagen – Verbindlichkeiten, falls vorhanden).

  4. **Rückstellungen-Sektion**
     - Filter auf Accounts mit `type=RESERVE` und/oder `group=RESERVE`.
     - Für jedes Reserve-Konto:
       - aktueller Saldo
       - optionaler Zielwert (du kannst fürs MVP ein simples Feld `targetPerYear` beim Account ergänzen; wenn zu aufwendig, erstmal weglassen).
  
  5. **Letzte Buchungen**
     - Tabelle mit den letzten x Transactions im aktuellen Monat (Datum, Konto, Kategorie, Betrag, Status).

### 3. Monatsübersicht / Monate wechseln

Route: `/months`

- Liste aller Monate (`Month`) des Users in einer Tabelle:
  - Jahr, Monat, Status.
  - Summen pro Monat (z.B. Net Cashflow Ist; für MVP reicht aber auch erstmal nur Monat + Status).
- Klick auf eine Zeile → öffnet `/months/[id]` mit einem **Monats-Dashboard**, das dem Haupt-Dashboard ähnelt, aber spezifisch für diesen Monat.

Extra:
- Button „Neuen Monat anlegen“:
  - Einfaches Formular (Jahr, Monat).
  - Optional: Du kannst beim Anlegen eines neuen Monats initial die Transaktionen ignorieren; Hauptsache, der Monat kann ausgewählt werden.

### 4. Transaktionsverwaltung

Route: `/transactions` (oder als Sektion im Monats-Dashboard)

- Liste aller Transactions des aktuellen Monats mit Filtern:
  - Filter nach Konto, Status (BOOKED/PLANNED), Direction (INCOME/EXPENSE).
- Formular „Neue Buchung“:
  - Felder: Datum, Konto, Betrag, Direction, TransactionType, Status, Kategorie, Notiz.
  - Beim Speichern → DB-Insert, UI-Refresh.
- Option, einen Eintrag zu bearbeiten/löschen (für MVP reicht Edit+Delete für einzelne Buchungen).

### 5. Vermögensübersicht (Wealth Overview)

Route: `/wealth`

- Nutze `WealthSnapshot` sowie live-berechnete Werte aus Accounts, um eine einfache Übersicht anzuzeigen:
  - Tabelle je Monat:
    - Datum/Monat
    - Gesamtvermögen
    - liquides Vermögen
    - Kapitalanlagen
    - Rückstellungen
  - Optional: einfache Chart-Komponente (z.B. mit recharts oder einer simplen Tailwind-basierten Darstellung), die die Entwicklung des Gesamtvermögens über die Zeit zeigt.

- Du kannst zu Beginn `WealthSnapshot` aus den aktuellen Account-Salden berechnen und nur für den aktuellen Monat einen Snapshot anlegen. Später kann ich das erweitern.

### 6. Plan vs. Ist (einfacher Einstieg)

Route: `/plan`

- Tabelle:
  - Je Monat (aus `PlanSnapshot`):
    - `plannedNetWorth`
    - daneben calculated `actualNetWorth` (aus Accounts/Snapshots)
    - Differenz
- Bonus (wenn noch Kapazität):
  - einfache Spalten „Zins pro Monat“, „Zins kumuliert“, „Zins pro Jahr“, die du aus der Differenz/Entwicklung ableitest. Es reicht ein sehr einfaches Modell (z.B. Wachstumsrate gegenüber Vor-Monat).

---

## Technische Details

Bitte erstelle:

1. **Projektstruktur** für eine typische Next.js-App mit App Router und TypeScript.
2. `package.json` mit allen benötigten Dependencies (Next, React, ReactDOM, Prisma, @prisma/client, Tailwind, ggf. NextAuth/Auth.js, bcrypt etc.).
3. `prisma/schema.prisma` mit den oben beschriebenen Models.
4. Ein `prisma/seed`-Script, das die Beispiel-Daten anlegt.
5. Tailwind-Konfiguration + Grundlayout (z.B. Hauptlayout mit Navigation links oder oben, Inhalt rechts).
6. Auth-Flow:
   - Login-Page.
   - Middleware/Server-Komponenten, um nur eingeloggten Nutzern Zugriff auf geschützte Routen zu geben.
7. Frontend-Komponenten:
   - Dashboard-Page,
   - Monatsliste,
   - Monatsdetailseite,
   - Transaktionsliste und -Formular,
   - Wealth-Page,
   - Plan-Page.
8. Zum Abschluss eine kurze README-ähnliche Anleitung im Output, wie ich das Projekt lokal starte:
   - `npm install`
   - `npx prisma migrate dev`
   - `npx prisma db seed`
   - `npm run dev`
   - Login-Daten (Benutzername/Passwort).

Schreibe sauberen, gut strukturierten Code mit Kommentaren an den wichtigsten Stellen, damit ich ihn später leicht erweitern kann. Wichtig ist, dass ich das Projekt direkt klonen, `npm install` ausführen und lokal starten kann, und anschließend in der UI:

- mich einloggen,
- einen Monat sehen,
- Konten mit aktuellen Salden sehen,
- Buchungen anlegen und in den Summen wiederfinden,
- eine einfache Vermögenshistorie erkennen.
