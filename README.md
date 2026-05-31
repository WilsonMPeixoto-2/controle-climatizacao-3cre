# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
Controle de Climatização — 3ª CRE / GOP is a web application for tracking and monitoring HVAC (air conditioning) maintenance/installation requests for schools in Brazil's 3rd Regional Education Coordination (3ª CRE). It replaces manual spreadsheets used by the GOP (Operations Management) team.

Key Technologies
Technology	Role
React 19	UI framework (SPA)
Vite 8	Build tool & dev server
Supabase	Backend-as-a-service (PostgreSQL database)
Leaflet	Interactive map rendering
Zod	Schema validation
Vercel	Hosting/deployment (auto-deploys on push to master)
canvas-confetti	Visual celebrations/feedback
ESLint	Code linting
Project Structure
Code
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Main styles
│   ├── main.jsx         # Entry point
│   ├── index.css        # Global styles
│   ├── components/
│   │   └── OperationalMap.jsx  # Leaflet-based map of schools
│   ├── lib/
│   │   └── logic.js     # Pure business logic (alerts, SLA, status rules)
│   ├── data/
│   │   ├── db.json              # Static/reference data
│   │   └── cre-bairros.geo.json # GeoJSON for neighborhood boundaries
│   └── assets/          # Static assets
├── supabase/
│   ├── schema.sql       # Database schema definition
│   ├── seed.sql         # Seed data for the database
│   └── CONEXAO_SUPABASE.md  # Supabase connection docs
├── test/
│   └── logic.test.mjs   # Unit tests for business logic
├── docs/
│   └── CONTEXTO.md      # Detailed project context & history
├── public/              # Static public assets
├── CLAUDE.md            # AI assistant instructions & project rules
├── package.json         # Dependencies & scripts
├── vite.config.js       # Vite configuration
├── eslint.config.js     # ESLint configuration
└── .env.example         # Environment variable template
Data Model (4 tables in Supabase)
chamados — Master record of each service request (unique ID, school, dates, status, responsible sector, next action)
historico — Timeline/log of milestones per request
escolas — Registry of ~134 schools (auto-fills school data during entry)
modelos_email — Email templates with variables like {ID_CHAMADO}, {UNIDADE}, {DATA}
Business Logic (src/lib/logic.js)
All rules are pure functions, tested separately:

11 status stages from "Received — in triage" through "Completed" and "Closed"
Two independent alert systems:
SLA/inertia alert — days without movement (amber ≥7 days, red ≥15 days)
Aging alert — total days open (purple ≥30 days, intense purple ≥60 days)
Sectors: GOP, GIN, CPS, CTO
Suggested action color coding for schools (red/amber/green)
How to Run
bash
npm install        # Install dependencies
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Run ESLint
npm test           # Run unit tests (Node.js, no browser needed)
Environment variables needed: VITE_SUPABASE_URL and VITE_SUPABASE_KEY (see .env.example).

Design Philosophy
Ambitious in execution, disciplined in scope — modernize how things are done without expanding what is done (GOP's job only, not CTO's inventory management).
Usability first — the target users are public servants who prefer paper over technology, so the UI must be extremely intuitive and inviting.
Single source of truth — replaces two disconnected spreadsheets with one unified, assisted workflow.
