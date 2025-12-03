# PWA Icons Setup

Für die vollständige PWA-Funktionalität benötigen Sie App-Icons.

## Erforderliche Icons

Platzieren Sie folgende Dateien im `/public` Ordner:

- `icon-192.png` - 192x192 Pixel
- `icon-512.png` - 512x512 Pixel

## Icon-Generierungen

### Option 1: Online-Tool
1. Besuchen Sie https://realfavicongenerator.net/
2. Laden Sie Ihr Logo hoch
3. Generieren Sie die Icons
4. Laden Sie die PNG-Dateien herunter

### Option 2: PWA Asset Generator (npm)

**WICHTIG:** Sie benötigen zuerst eine `logo.png` Datei (mindestens 512x512 Pixel) im Projekt-Root!

1. Erstellen Sie ein Logo:
   - Option A: SVG zu PNG konvertieren (z.B. https://cloudconvert.com/svg-to-png)
   - Option B: Online Logo-Generator verwenden (z.B. Canva, Figma)
   - Option C: Eigene Logo-Datei erstellen (512x512 Pixel)

2. Speichern Sie das Logo als `logo.png` im Projekt-Root (gleiche Ebene wie `package.json`)

3. Führen Sie dann aus:
```bash
pwa-asset-generator logo.png public --icon-only
```

**Hinweis:** Wenn Sie `logo.svg` haben, konvertieren Sie es zuerst zu PNG!

### Option 3: Manuell
1. Erstellen Sie ein 512x512 Pixel großes Icon
2. Skalieren Sie es auf 192x192 Pixel für das kleinere Icon
3. Speichern Sie beide als PNG im `/public` Ordner

## Icon-Design-Tipps

- Verwenden Sie ein einfaches, erkennbares Logo
- Achten Sie auf gute Lesbarkeit in kleinen Größen
- Verwenden Sie transparenten Hintergrund oder passende Hintergrundfarbe
- Testen Sie das Icon auf verschiedenen Hintergründen

## Nach dem Hinzufügen der Icons

1. Starten Sie den Dev-Server neu: `npm run dev`
2. Die Icons werden automatisch vom Manifest geladen
3. Testen Sie die Installation der PWA im Browser

