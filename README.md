# DocuVault Frontend

Interfaccia utente per il sistema di gestione documentale DocuVault.

## Requisiti

- Node.js 18+
- npm o yarn

## Setup Locale

1. **Clona il repository**
```bash
git clone https://github.com/federicodipierro87-beep/docfeed-frontend.git
cd docfeed-frontend
```

2. **Installa dipendenze**
```bash
npm install
```

3. **Configura environment**
```bash
cp .env.example .env
# Modifica VITE_API_URL se necessario
```

4. **Avvia in development**
```bash
npm run dev
```

L'app sarà disponibile su http://localhost:5173

## Build Produzione

```bash
npm run build
```

I file compilati saranno nella cartella `dist/`.

## Stack Tecnico

- **React 18** - Framework UI
- **Vite** - Build tool
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **shadcn/ui** - Componenti UI
- **React Query** - Data fetching
- **Zustand** - State management
- **React Router** - Routing
- **React Hook Form + Zod** - Form e validazione

## Struttura Progetto

```
src/
├── components/
│   ├── ui/          # Componenti shadcn/ui
│   ├── layout/      # Layout (Sidebar, TopBar)
│   ├── documents/   # Componenti documenti
│   └── ...
├── pages/           # Pagine dell'app
├── store/           # Store Zustand
├── hooks/           # Custom hooks
├── lib/             # Utilities e API client
└── types/           # TypeScript types
```

## Deploy su Netlify

Il progetto include configurazione Netlify (`netlify.toml`).

1. Connetti repository a Netlify
2. Configura variabili ambiente (`VITE_API_URL`)
3. Deploy automatico su push

## Credenziali Demo

| Email | Password | Ruolo |
|-------|----------|-------|
| admin@demo.com | Password123! | Admin |
| manager@demo.com | Password123! | Manager |
| user1@demo.com | Password123! | User |

## Licenza

Proprietario - Demo Corp
