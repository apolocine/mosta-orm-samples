# 16-mosta-parkmanager

> **Sample showcase end-to-end** : application complète Next.js 16 + Electron de **gestion d'un parc de loisirs / d'attractions**. Démontre comment **assembler 11 modules `@mostajs/*`** (orm, data-plug, auth, rbac, audit, scan, ui, settings, menu, init, net) dans un vrai produit. Bootstrap minimal `data-plug + config (cascade env) + orm`. Pas de wizard — tout via `.env`.

**Couvre** : `@mostajs/orm` 2.2.5 production-grade · `@mostajs/data-plug` (résolution ORM/NET) · cascade `@mostajs/config` · `BaseRepository` × 14 entités · soft-delete (R003B) · audit-by-fields · relations cascade · multi-dialecte (SQLite/Postgres/MySQL/Oracle/MongoDB) · mode Electron desktop · mode NET hybride · NextAuth v5 + RBAC matriciel · scan QR + RFID + biométrie faciale.

## Install

```bash
mkdir tmp && cd tmp && npm init -y && npm install @mostajs/orm-samples
cp -r node_modules/@mostajs/orm-samples/examples/16-mosta-parkmanager ~/my-parkmanager
cd ~/my-parkmanager
rm -rf ../tmp
```

## External resources

- Node.js ≥ 18
- npm ≥ 9
- *Optionnel* — drivers SGBD si pas SQLite : `pg` / `mysql2` / `oracledb` / `mariadb` (auto-installés par `npm install`)
- *Optionnel* — pour le build Electron : dépendances système (libnss3, libgconf, …)

## Run

```bash
./16-mosta-parkmanager.sh
```

Le script :
1. Installe les dépendances (premier run uniquement)
2. Crée `.env.local` depuis `.env.example` avec `NEXTAUTH_SECRET` généré
3. Lance `seed:admin` (admin créé, password imprimé console si non défini en env)
4. Démarre Next.js sur <http://localhost:4567>

## Expected output

```
─── Installing dependencies (first run) ───
─── Creating .env.local from .env.example ───
─── Seeding admin ───
═══ Seed admin — mosta-parkmanager ═══
Email     : admin@park.demo
Password  : (généré aléatoire — voir ci-dessous)
Dialect   : sqlite
URI       : ./data/parkmanager.db

✓ Admin admin@park.demo créé.

═══ Mot de passe généré (à conserver — ne sera pas réaffiché) ═══

    XyZ23p9KmBq4HwLn

Connectez-vous puis modifiez ce mot de passe.

─── Starting Next.js on http://localhost:4567 ───
   ▲ Next.js 16.x
   - Local:        http://localhost:4567
   ✓ Ready in 1.2s
```

Naviguer sur <http://localhost:4567> → redirige vers `/login` → connectez-vous
avec `admin@park.demo` + le password imprimé → accès au dashboard.

## What it shows

Ce sample est volontairement le **plus gros** de la galerie `@mostajs/orm-samples`
(samples 01-15 = micro-démos par feature, ~50-200 LOC ; sample 16 = vrai
projet complet de plusieurs milliers de LOC). Il démontre **comment tout
s'articule en production** :

### Bootstrap minimal (3 modules)

```ts
// src/dal/service.ts — point d'entrée DAL
import { getDialect } from '@mostajs/data-plug'

async function dialect() {
  await import('./registry')      // side-effect: registerSchemas(@mostajs/orm)
  return getDialect()              // résout ORM ou NET selon cascade env
}
```

La cascade `@mostajs/config` (ré-exportée par `@mostajs/orm`) lit `.env` :

```bash
DB_DIALECT=sqlite                  # ou postgres/mysql/oracle/mongodb/…
SGBD_URI=./data/parkmanager.db     # auto si SQLite
# MOSTA_NET_URL=https://api…       # défini ? bascule mode NET via data-plug
```

### 14 entités modélisées

`src/dal/schemas/` : User, Role, Permission, PermissionCategory, Client,
SubscriptionPlan, Activity, ClientAccess, Ticket, ScanLog, Locker, RfidTag,
LockerEvent, AuditLog.

Chaque entité = `EntitySchema` de `@mostajs/orm` (cf. sample 05). 4 ont
des relations cascade SQL natives (sample 10). 8 ont `softDelete: true`
+ sparse partial unique pour réinsertion (sample 13). 5 ont des champs
audit-by selon `DEFAULT_AUDIT_BY_FIELDS` (sample 14).

### 11 modules `@mostajs/*` en production

Voir section [Modules](#modules-mostajs-utilisés-11) ci-dessous pour le
détail de chacun.

### 3 modes runtime

1. **Web SaaS** — Next.js + Postgres distant
2. **Desktop autonome** — Electron + better-sqlite3 (zéro serveur)
3. **Hybride léger** — Electron léger + `MOSTA_NET_URL` distant (data-plug)

---

# Documentation complète projet

À partir d'ici, la doc applicative détaillée. Les sections ci-dessus
suffisent pour faire tourner le sample ; la suite est utile si vous
adoptez l'architecture comme base de votre propre produit.

## Sommaire

1. [Pourquoi ce projet](#pourquoi-ce-projet)
2. [Stack technique](#stack-technique)
3. [Modules `@mostajs/*` utilisés (11)](#modules-mostajs-utilisés-11)
4. [Modèles métier (14 entités)](#modèles-métier-14-entités)
5. [Architecture](#architecture)
6. [Configuration cascade `@mostajs/config`](#configuration-cascade-mostajsconfig)
7. [Support multi-dialecte (6 SGBD)](#support-multi-dialecte-6-sgbd)
8. [Mode Electron (desktop)](#mode-electron-desktop)
9. [Aller plus loin — 15 autres samples](#aller-plus-loin--15-autres-samples)
10. [Licence](#licence)

---

## Pourquoi ce projet

L'écosystème `@mostajs/*` propose une douzaine de modules indépendants.
Le module [`@mostajs/orm-samples`](https://www.npmjs.com/package/@mostajs/orm-samples)
publie **15 micro-démos** focalisées (un sample par feature).

**Ce sample 16 va plus loin** : projet end-to-end qui assemble **11 modules
`@mostajs/*` dans un vrai produit** réaliste — abonnements, tickets, scan
QR/RFID, biométrie faciale, casiers verrouillables, audit. Bootstrap
minimaliste (`data-plug + config + orm`), **zéro wizard de setup**, config
exclusivement via `.env`.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework web | **Next.js 16** (App Router) + React 19 |
| Desktop | **Electron 34** (build multi-OS via electron-builder) |
| Auth | **NextAuth v5** (via `@mostajs/auth`) |
| ORM | **`@mostajs/orm` 2.2.5** (multi-dialecte) |
| Couche d'accès | **`@mostajs/data-plug`** — résolution ORM/NET |
| Config | **`@mostajs/config`** (cascade env, ré-exporté par `@mostajs/orm`) |
| SGBD défaut | SQLite (better-sqlite3) — zero-config |
| RBAC | **`@mostajs/rbac`** (matrice rôle × ressource × action) |
| UI | **`@mostajs/ui`** (Tailwind 4 + shadcn + radix-ui + lucide) |
| Forms | react-hook-form + zod |
| Scan | html5-qrcode + face-api (`@vladmandic/face-api`) |
| Audit | **`@mostajs/audit`** |
| State serveur | TanStack Query v5 |

---

## Modules `@mostajs/*` utilisés (11)

### Cœur (data + auth + config)

| Module | Version | Rôle |
|---|---|---|
| [`@mostajs/orm`](https://www.npmjs.com/package/@mostajs/orm) | `^2.2.5` | ORM multi-dialecte. 14 `EntitySchema`, `BaseRepository`, filtres MongoDB-like. ➡️ `src/dal/schemas/*.ts` |
| [`@mostajs/data-plug`](https://www.npmjs.com/package/@mostajs/data-plug) | `^1.2.5` | Plug d'accès — résout `getDialect()` en ORM local OU NET distant (cascade env). ➡️ `src/dal/service.ts` |
| [`@mostajs/auth`](https://www.npmjs.com/package/@mostajs/auth) | `^2.0.2` | Wrapper NextAuth v5. ➡️ `src/app/api/auth/[...nextauth]` |
| [`@mostajs/rbac`](https://www.npmjs.com/package/@mostajs/rbac) | `^2.0.8` | Matrice de permissions. ➡️ tous les endpoints API |

### Infrastructure

| Module | Version | Rôle |
|---|---|---|
| [`@mostajs/init`](https://www.npmjs.com/package/@mostajs/init) | `^1.1.0` | Bootstrap déterministe au boot serveur. |
| [`@mostajs/settings`](https://www.npmjs.com/package/@mostajs/settings) | `^2.0.5` | Key-value store. ➡️ `src/app/api/settings` |
| [`@mostajs/audit`](https://www.npmjs.com/package/@mostajs/audit) | `^2.0.4` | Trace journalisée. ➡️ `AuditLog` + `ScanLog` + `LockerEvent` |
| [`@mostajs/menu`](https://www.npmjs.com/package/@mostajs/menu) | `^1.0.4` | Sidebar filtrée RBAC. |

### Spécialisations

| Module | Version | Rôle |
|---|---|---|
| [`@mostajs/scan`](https://www.npmjs.com/package/@mostajs/scan) | `^1.1.0` | Scanner QR / RFID côté agent. ➡️ `src/app/agent` |
| [`@mostajs/ui`](https://www.npmjs.com/package/@mostajs/ui) | `^1.0.3` | Design system Tailwind + shadcn. |
| [`@mostajs/net`](https://www.npmjs.com/package/@mostajs/net) | `^2.0.8` | NetDialect consommé par `data-plug` quand `MOSTA_NET_URL` défini. |

### Optionnel

| Module | Version | Rôle |
|---|---|---|
| [`@mostajs/ornetadmin`](https://www.npmjs.com/package/@mostajs/ornetadmin) | `^1.0.1` *(optional)* | Admin du dialect NET (monitoring). |

> 💡 **`@mostajs/setup` n'est pas utilisé** : le projet démarre directement
> sur `data-plug + config (cascade) + orm` — toute la config via `.env`,
> l'admin via `npm run seed:admin`. Wizard volontairement absent pour un
> bootstrap minimal et reproductible.

---

## Modèles métier (14 entités)

`src/dal/schemas/` — tous définis comme `EntitySchema` de `@mostajs/orm` :

| Entité | Rôle | Soft-delete |
|---|---|---|
| **User** | Personnel : opérateurs, superviseurs, admins | ✅ |
| **Role** | RBAC : admin, agent, superviseur, viewer | — |
| **Permission** | Action sur ressource | — |
| **PermissionCategory** | Regroupement logique de permissions | — |
| **Client** | Visiteur/abonné : profil, photo, descriptor facial | ✅ |
| **SubscriptionPlan** | Plans d'abonnement (durée + quotas par activité) | ✅ |
| **Activity** | Piscine, parc d'attractions, tennis, etc. | ✅ |
| **ClientAccess** | Liaison Client × Activity (quota restant, dates) | ✅ |
| **Ticket** | Billet unitaire ou abonnement, QR code | ✅ |
| **ScanLog** | Trace de chaque validation au point d'entrée | — |
| **Locker** | Casier physique : numéro, capacité, RFID | — |
| **RfidTag** | Tag RFID associé à un client | ✅ |
| **LockerEvent** | Audit ouverture/fermeture casier | — |
| **AuditLog** | Journal global des actions sensibles | — |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Next.js 16 (App Router)                    │
│                                                                │
│   /agent     ─ scan QR/RFID + contrôle face   @mostajs/scan    │
│   /dashboard ─ pilotage / KPI / clients / tickets / lockers    │
│   /api/*     ─ REST endpoints                                  │
└─────────────────┬──────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │  @mostajs/auth    │  NextAuth v5 sessions
        │  @mostajs/rbac    │  matrice rôle×ressource×action
        │  @mostajs/audit   │  journalisation actions sensibles
        └─────────┬─────────┘
                  │
                  ▼
        ┌────────────────────┐
        │  @mostajs/data-plug│  getDialect() — résolution ORM/NET
        └────────┬───────────┘
                 │
       ┌─────────┴────────────┐
       │ MOSTA_NET_URL absent │ MOSTA_NET_URL défini
       ▼                      ▼
┌──────────────┐    ┌────────────────────┐
│ @mostajs/orm │    │  @mostajs/net      │ ─── HTTP ──►  serveur distant
│ +  @mostajs/ │    │  (NetDialect)      │              (poste multi-client)
│  config (env)│    └────────────────────┘
│              │
│ SQLite, PG,  │
│ MySQL, etc.  │
└──────────────┘
```

---

## Configuration cascade `@mostajs/config`

`@mostajs/orm` ré-exporte `getConfigFromEnv()` de `@mostajs/config`. La
cascade lit dans cet ordre (premier défini gagne) :

```
1. process.env (déjà défini par le shell)
2. .env.${MOSTA_ENV}.local                 → ex: .env.dev.local
3. .env.${MOSTA_ENV}                       → ex: .env.dev
4. .env.local
5. .env
```

Variables principales (voir `.env.example`) :

| Variable | Effet |
|---|---|
| `DB_DIALECT` | `sqlite` / `postgres` / `mysql` / `mariadb` / `oracle` / `mongodb` |
| `SGBD_URI` | URI complet selon dialect |
| `MOSTA_NET_URL` | **Si défini**, bascule en mode NET (data-plug consume HTTP) |
| `MOSTA_NET_APIKEY` | Clé API pour mode NET |
| `NEXTAUTH_SECRET` | Secret session NextAuth (32 bytes base64) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap admin via `npm run seed:admin` |
| `SHOW_SQL` | Log SQL généré par `@mostajs/orm` (debug) |

---

## Support multi-dialecte (6 SGBD)

| Dialect | `npm` driver | Statut |
|---|---|---|
| **SQLite** | `better-sqlite3` | ✅ Production-ready (défaut) — Embedded, Electron |
| **PostgreSQL** | `pg` | ✅ Production-ready |
| **MySQL** | `mysql2` | ✅ Production-ready |
| **MariaDB** | `mariadb` | ✅ Production-ready |
| **Oracle** | `oracledb` | ✅ Production-ready (Enterprise) |
| **MongoDB** | `mongoose` | ⚠️ Partiel (selon entités) |

Bascule via `.env.local` — aucun changement de code applicatif requis.

---

## Mode Electron (desktop)

Trois modes runtime :

1. **SaaS web** — Next.js standard + Postgres/MySQL distant
2. **Desktop autonome** — Electron + better-sqlite3 (zéro serveur)
3. **Hybride léger** — Electron + `@mostajs/net` distant

Build desktop :

```bash
./build-mosta-parkmanager.sh                # produit dist/ multi-OS
```

---

## Aller plus loin — 15 autres samples

Les samples 01-15 démontrent **feature par feature** comment `@mostajs/orm`
est utilisé dans ce sample 16 :

```bash
npx @mostajs/orm-samples list           # liste les 16 samples
```

| # | Sample | Démonstration |
|---|---|---|
| 01 | quickstart-sqlite | Hello-world : `createConnection` + `BaseRepository` |
| 02 | multi-dialect-switch | Un seul code TS, dialect via `.env` |
| 03 | isolated-connections | `createIsolatedDialect` + named connections |
| 04 | schema-registry | Registre `registerSchema`/`getSchema` |
| 05 | types-cles-entity-schema | `EntitySchema` exhaustif |
| 06 | base-repository-crud | 15 méthodes `BaseRepository` |
| 07 | filter-query-mongodb-like | 12 opérateurs FilterOperator |
| 08 | aggregate-pipeline | Pipeline `aggregate` (MongoDB) |
| 09 | findbyid-polymorphic | 4 formes `findById` + `extractRelId` |
| 10 | relations-cascade | 4 RelationType + `onDelete: cascade` |
| 11 | lazy-vs-eager-fetch | BREAKING 2.0 lazy default |
| 12 | migration-diff | `diffSchemas` + `strategy: 'update'` |
| 13 | soft-delete-native | `softDelete` + sparse partial unique |
| 14 | audit-by-fields | `DEFAULT_AUDIT_BY_FIELDS` + wrapper |
| 15 | tx-manual-savepoints | `$transaction(cb)` + nested SAVEPOINT |
| **16** | **mosta-parkmanager** | **Vous êtes ici — full app end-to-end** |

---

## Licence

AGPL-3.0-or-later — voir `LICENSE` à la racine du sample.

## Crédits

**Dr Hamid MADANI** <drmdh@msn.com> · architecte et auteur principal.
Construction sur l'écosystème [mostajs.dev](https://mostajs.dev).
