# AGENTS.md — Front Legaly

## Stack

- React 19, Vite 8, Tailwind CSS 4, React Router 7
- JavaScript (JSX) — no TypeScript
- ESLint 9 flat config

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Vite HMR) |
| `npm run build` | Production build → `dist/` |
| `npm run lint` | Lint all `*.{js,jsx}` files |
| `npm run preview` | Preview production build locally |

No test runner, no type-checking.

## Architecture

- **Entry**: `src/main.jsx` → `src/App.jsx`
- **Routing** (`src/App.jsx`): Public routes (Login) vs. protected routes wrapped in `<Layout />`
- **Layout** (`src/components/Layout.jsx`): sidebar + header + `<Outlet />` — passes `datosUsuario`, `catalogos`, `casosPendientes` via `Outlet context`
- **Pages**: `src/pages/*.jsx` — one component per route
- **Components**: `src/components/` — domain subfolders (`expedientes/`, `configuracion/`, `ui/`)

## API & Auth

- All services use `axios` with `axios.defaults.withCredentials = true` (cookie-based auth)
- Base URLs constructed as `` `${import.meta.env.VITE_API_URL}/<endpoint>` ``
- `VITE_API_URL=http://localhost:3000/api` in `.env.development` (committed)
- Auth flow: `authService.login()` → sets HTTP-only cookie → `authService.isAuthenticated()` calls `/auth/verify`

## Service pattern

Each file in `src/services/` exports a plain object with async methods. Example:

```js
const somethingService = { metodo1, metodo2 };
export default somethingService;
```

## Styling

- Tailwind CSS v4 via `@tailwindcss/postcss` PostCSS plugin (NOT the old `@tailwind` CSS directives)
- Entry CSS: `src/index.css` has only `@import "tailwindcss";`
- PostCSS plugins are configured inline in `postcss.config.js` (object export)
- Custom color `legal-blue` defined in `tailwind.config.js`

## Docker

Multi-stage Dockerfile: Node 20 Alpine build → Nginx stable Alpine serving `dist/`.
Nginx config for client-side routing (React Router) is **not included** — may need one for production.

## Lint quirks

- ESLint 9 flat config, uses `globalIgnores(['dist'])` and `defineConfig([...])` from `eslint/config`
- Rule: `no-unused-vars` ignores variables starting with uppercase `^[A-Z_]`
- Runs on `*.{js,jsx}` only
