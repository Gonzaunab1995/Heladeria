# IceCream Frontend 🍦

React 18 + Vite + Tailwind 4 + React Router + TanStack Query.

## Local
```bash
npm install
cp .env.example .env    # en Windows: copy .env.example .env
npm run dev
```
Abre http://localhost:5173 (el back debe estar en `VITE_API_URL`, por defecto http://localhost:8000).

## Build
```bash
npm run build
```

## Vercel
Importá el repo, elegí `icecream-frontend` como *Root Directory* y cargá la variable `VITE_API_URL` con la URL pública del back.
