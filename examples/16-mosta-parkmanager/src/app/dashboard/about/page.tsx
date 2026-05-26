// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { t } from '@/i18n'
import {
  Shield, Users, ScanFace, DoorOpen, CreditCard, FileText,
  Zap, Lock, Server
} from 'lucide-react'

const features = [
  { key: 'access', icon: DoorOpen, color: 'blue' },
  { key: 'clients', icon: Users, color: 'green' },
  { key: 'facial', icon: ScanFace, color: 'purple' },
  { key: 'lockers', icon: Lock, color: 'orange' },
  { key: 'subscriptions', icon: CreditCard, color: 'red' },
  { key: 'reports', icon: FileText, color: 'yellow' },
] as const

const colorClasses: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('about.title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('about.subtitle')}
        </p>
      </div>

      {/* Mission */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t('about.mission.title')}
        </h2>
        <p className="text-gray-600 leading-relaxed">
          {t('about.mission.description')}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feat) => {
          const Icon = feat.icon
          const colors = colorClasses[feat.color]
          return (
            <div key={feat.key} className="bg-white rounded-lg shadow-sm p-6">
              <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className={`h-6 w-6 ${colors.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(`about.features.${feat.key}.title`)}
              </h3>
              <p className="text-gray-600">
                {t(`about.features.${feat.key}.description`)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Technical Info */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('about.technical.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('about.technical.frontend.title')}
            </h3>
            <ul className="text-gray-600 space-y-1">
              <li>• Next.js 16 avec App Router</li>
              <li>• React 19 avec TypeScript</li>
              <li>• Tailwind CSS pour le design</li>
              <li>• NextAuth.js pour l&apos;authentification</li>
              <li>• PWA (Progressive Web App)</li>
              <li>• Système i18n intégré</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('about.technical.backend.title')}
            </h3>
            <ul className="text-gray-600 space-y-1">
              <li>• API Routes Next.js</li>
              <li>• MongoDB avec Mongoose ODM</li>
              <li>• Système RBAC granulaire</li>
              <li>• Sessions sécurisées JWT</li>
              <li>• face-api.js (reconnaissance faciale)</li>
              <li>• Architecture MVC moderne</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Advanced Architecture */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-sm p-8 mb-8 text-white">
        <h2 className="text-2xl font-bold mb-6">
          {t('about.architecture.title')}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">
              <Zap className="inline h-5 w-5 mr-2" />
              {t('about.architecture.performance.title')}
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Temps de réponse API &lt;200ms</li>
              <li>• Indexation MongoDB optimisée</li>
              <li>• Code splitting automatique</li>
              <li>• PWA avec cache intelligent</li>
              <li>• Pagination efficace des données</li>
            </ul>
          </div>

          {/* Security */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-400">
              <Shield className="inline h-5 w-5 mr-2" />
              {t('about.architecture.security.title')}
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• RBAC multi-rôles</li>
              <li>• Sessions sécurisées JWT</li>
              <li>• Validation stricte des données</li>
              <li>• Reconnaissance faciale</li>
              <li>• Audit trail complet</li>
            </ul>
          </div>

          {/* Architecture */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">
              <Server className="inline h-5 w-5 mr-2" />
              {t('about.architecture.design.title')}
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Pattern Repository/Service</li>
              <li>• API RESTful cohérente</li>
              <li>• Composants React modulaires</li>
              <li>• QR Code + RFID intégrés</li>
              <li>• Clean Code &amp; SOLID principles</li>
            </ul>
          </div>
        </div>

        {/* Key Achievements */}
        <div className="mt-8 border-t border-gray-700 pt-6">
          <h3 className="text-lg font-semibold mb-4 text-yellow-400">
            {t('about.architecture.achievements.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Contrôle d\'accès multi-modal (QR + RFID + Face)',
              'PWA mobile pour les agents de contrôle',
              'Reconnaissance faciale temps réel intégrée',
              'Gestion automatisée des casiers et quotas',
              'Système RBAC multi-rôles complet',
              'Internationalisation complète (FR/EN/AR)',
            ].map((text, i) => (
              <div key={i} className="flex items-center space-x-3">
                <span className="text-green-400">&#10003;</span>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">99.9%</div>
            <div className="text-xs text-gray-400">{t('about.architecture.metrics.uptime.label')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">RBAC</div>
            <div className="text-xs text-gray-400">{t('about.architecture.metrics.access.label')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">PWA</div>
            <div className="text-xs text-gray-400">{t('about.architecture.metrics.mobile.label')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">3</div>
            <div className="text-xs text-gray-400">{t('about.architecture.metrics.roles.label')}</div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {t('about.team.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">DM</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('about.team.moe.name')}
            </h3>
            <p className="text-blue-600 font-medium mb-2">
              {t('about.team.moe.role')}
            </p>
            <p className="text-gray-600 text-sm">
              {t('about.team.moe.description')}
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">SL</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('about.team.moa.name')}
            </h3>
            <p className="text-indigo-600 font-medium mb-2">
              {t('about.team.moa.role')}
            </p>
            <p className="text-gray-600 text-sm">
              {t('about.team.moa.description')}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            {t('about.team.collaboration.title')}
          </h4>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('about.team.collaboration.description')}
          </p>
        </div>
      </div>

      {/* Version */}
      <div className="text-center text-gray-500 pb-8">
        <p>{t('about.version')}</p>
        <p className="text-sm mt-2">{t('about.credits')}</p>
      </div>
    </div>
  )
}
