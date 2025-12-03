# Migration: AccountType und AccountGroup von Enums zu Tabellen

Diese Migration wandelt die AccountType und AccountGroup Enums in Tabellen um, damit sie bearbeitbar werden.

## Wichtige Hinweise

⚠️ **Diese Migration ist destruktiv!** Sie löscht alle bestehenden Accounts und erstellt sie neu.

## Migrationsschritte

1. **Backup erstellen** (empfohlen):
   ```bash
   # PostgreSQL Backup
   pg_dump -U user -d drbalance > backup_before_migration.sql
   ```

2. **Migration ausführen**:
   ```bash
   npx prisma migrate dev --name convert_account_enums_to_tables
   ```

3. **Seed-Script ausführen** (erstellt die Standard-Typen und -Gruppen):
   ```bash
   npx prisma db seed
   ```

## Was sich ändert

- `AccountType` und `AccountGroup` werden von Enums zu Tabellen
- Accounts verwenden jetzt `typeId` und `groupId` statt `type` und `group`
- Neue Verwaltungsseite unter `/settings` für Typen und Gruppen
- Alle bestehenden Accounts müssen neu angelegt werden (durch Seed-Script)

## Nach der Migration

1. Gehen Sie zu `/settings`
2. Überprüfen Sie die erstellten Typen und Gruppen
3. Passen Sie sie nach Bedarf an
4. Erstellen Sie Ihre Konten neu unter `/accounts`

