# ☕ Coffee Companion

Eine Progressive Web App (PWA) für Specialty Coffee Enthusiasten mit KI-gestützter Kaffee-Analyse und individuellen Brew-Empfehlungen.

## ✨ Features

- 📷 **Foto-Analyse**: Fotografiere deine Kaffeepackung - Claude extrahiert automatisch alle Infos
- ✍️ **Manuelle Eingabe**: Alternative Eingabe-Methode ohne API-Nutzung
- 🎯 **Intelligente Brew-Empfehlungen**: 
  - Mahlgrad für Fellow Ode Gen2
  - Optimale Wassertemperatur
  - Detaillierte V60 Aufguss-Schritte
  - Basierend auf Aufbereitungsmethode
- 💾 **Lokale Speicherung**: Alle Daten bleiben auf deinem Gerät
- 📱 **Installierbar**: Funktioniert als native App auf iOS & Android
- 🌐 **Offline-fähig**: Gespeicherte Kaffees immer verfügbar

## 🚀 Schnellstart

Siehe **[DEPLOYMENT.md](DEPLOYMENT.md)** für die komplette Schritt-für-Schritt Anleitung.

**Kurz-Version:**
1. Anthropic API Key holen ($5 Credits)
2. Backend auf Vercel deployen
3. Frontend hosten (GitHub Pages oder Vercel)
4. Backend URL in App-Einstellungen eintragen
5. Fertig! ☕

## 📁 Struktur

```
coffee-app-full/
├── backend/           # Node.js Backend
│   ├── server.js      # Express Server mit Claude API
│   ├── package.json   # Dependencies
│   ├── vercel.json    # Vercel Config
│   └── .env.example   # Environment Variables Template
│
├── frontend/          # PWA Frontend
│   ├── index.html     # Haupt-App
│   └── manifest.json  # PWA Manifest
│
└── DEPLOYMENT.md      # Detaillierte Anleitung
```

## 🛠️ Technologie-Stack

**Backend:**
- Node.js + Express
- Anthropic Claude API (Sonnet 4)
- Vercel Hosting

**Frontend:**
- Vanilla HTML/CSS/JavaScript
- Progressive Web App (PWA)
- LocalStorage für Datenpersistenz

## 💰 Kosten

- **Anthropic API**: $5 einmalig (~ 600 Kaffee-Analysen)
- **Hosting**: Kostenlos (Vercel Free Tier)
- **Pro Analyse**: ~$0.008 (< 1 Cent)

## 🎯 Brew-Logik

Die App erkennt automatisch den Aufbereitungsprozess und passt die Empfehlungen an:

| Prozess | Mahlgrad | Temp | Charakteristik |
|---------|----------|------|----------------|
| Nitro / Anaerobic / Carbonic | 3-3.5 | 91-92°C | Experimentell - kühl für volatile Aromen |
| Natural / Honey / Yeast | 4-4.5 | 93-94°C | Gröber - höhere Temp für gute Extraktion |
| Washed (Standard) | 3.5-4 | 92-93°C | Ausgewogen |

## 📱 Screenshots

(Hier könnten Screenshots eingefügt werden)

## 🤝 Für dich erstellt von Claude

Diese App wurde speziell für deine Bedürfnisse entwickelt:
- Fellow Ode Gen2 Mahlgrad-Empfehlungen
- V60 Aufguss-Protokolle
- Specialty Coffee mit experimentellen Fermentationen
- Südseite Coffee Röstungen 😉

Viel Spaß beim Brauen! ☕✨
