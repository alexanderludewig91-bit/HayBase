# HayBase

Eine persönliche Finanzverwaltungs-Webapp für detailliertes Haushaltsbuch-Management.

## Features

- **Monatsübersicht**: Verwaltung von Monaten mit Einnahmen/Ausgaben
- **Kontenverwaltung**: Übersicht über Girokonten, Tagesgeld, Depots, Bargeld und Rückstellungen
- **Transaktionsverwaltung**: Erfassen, Bearbeiten und Löschen von Buchungen (Ist und geplant)
- **Vermögensübersicht**: Entwicklung des Vermögens über die Zeit mit Charts
- **Plan vs. Ist**: Vergleich von geplanten und tatsächlichen Vermögenswerten mit Zinsberechnung

## Technologie-Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Prisma** (ORM)
- **PostgreSQL** (Datenbank)
- **NextAuth.js** (Authentifizierung)
- **Recharts** (Diagramme)

## Voraussetzungen

- Node.js 18+ 
- PostgreSQL (lokal installiert oder Docker)
- npm oder yarn

## Installation

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Umgebungsvariablen konfigurieren:**
   
   Erstellen Sie eine `.env` Datei im Root-Verzeichnis:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/haybase?schema=public"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   ```
   
   Passen Sie die `DATABASE_URL` an Ihre PostgreSQL-Installation an.

3. **Datenbank migrieren:**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed-Daten laden:**
   ```bash
   npx prisma db seed
   ```

5. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

6. **App öffnen:**
   
   Öffnen Sie [http://localhost:3000](http://localhost:3000) im Browser.

## Login-Daten

Nach dem Seed-Script können Sie sich mit folgenden Daten anmelden:

- **Benutzername:** `Alex`
- **Passwort:** `test123`

## Projektstruktur

```
haybase/
├── app/                    # Next.js App Router Seiten
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard-Seite
│   ├── login/              # Login-Seite
│   ├── months/             # Monatsübersicht
│   ├── transactions/       # Transaktionsverwaltung
│   ├── wealth/             # Vermögensübersicht
│   └── plan/               # Plan vs. Ist
├── components/             # React-Komponenten
│   ├── ui/                 # shadcn/ui Komponenten
│   ├── layout/             # Layout-Komponenten
│   ├── transactions/       # Transaktions-Komponenten
│   ├── months/             # Monats-Komponenten
│   ├── wealth/             # Vermögens-Komponenten
│   └── plan/               # Plan-Komponenten
├── lib/                    # Utility-Funktionen
│   ├── auth.ts             # Auth-Helper
│   ├── auth-options.ts     # NextAuth Konfiguration
│   ├── prisma.ts           # Prisma Client
│   ├── formatters.ts       # Formatierungs-Funktionen
│   └── utils.ts            # Allgemeine Utilities
├── prisma/                 # Prisma Schema und Migrations
│   ├── schema.prisma       # Datenbank-Schema
│   └── seed.ts             # Seed-Script
└── types/                  # TypeScript Typen
```

## Datenmodell

- **User**: Benutzer mit Authentifizierung
- **Account**: Konten (Giro, Tagesgeld, Depot, Bargeld, Rückstellungen)
- **Month**: Monate mit Status (OPEN/CLOSED)
- **Transaction**: Buchungen mit Richtung, Typ, Status und Kategorie
- **WealthSnapshot**: Vermögenssnapshots für Historie
- **PlanSnapshot**: Geplante Vermögenswerte

## Entwicklung

### Datenbank-Schema aktualisieren

Nach Änderungen am Prisma Schema:

```bash
npx prisma migrate dev
```

### Prisma Studio öffnen

Für visuelle Datenbank-Verwaltung:

```bash
npx prisma studio
```

### Build für Produktion

```bash
npm run build
npm start
```

## Deployment auf Railway

Die App ist für Deployment auf Railway vorbereitet. Stellen Sie sicher, dass:

1. Die `DATABASE_URL` Umgebungsvariable in Railway gesetzt ist
2. `NEXTAUTH_SECRET` und `NEXTAUTH_URL` gesetzt sind
3. Die Datenbank-Migrationen beim Deployment ausgeführt werden

## Lizenz

Privat - Nur für persönliche Nutzung





