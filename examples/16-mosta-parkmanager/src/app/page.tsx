// Author: Dr Hamid MADANI <drmdh@msn.com>
import { redirect } from 'next/navigation'

export default function Home() {
  // L'app démarre directement : data-plug + config (cascade env) + orm
  // bootstrap au boot. Pas de setup wizard — la config DB est lue de .env.
  // Première connexion : admin créé via `npm run seed` (ADMIN_PASSWORD env).
  redirect('/login')
}
