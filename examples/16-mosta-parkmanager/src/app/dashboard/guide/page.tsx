// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState } from 'react'
import { t } from '@/i18n'
import {
  Book, Play, Settings, Shield, Zap,
  CheckCircle, Users, ScanFace, Smartphone,
  DoorOpen, Lock, User, UserPlus, Ticket,
  QrCode, Eye, Cpu, ShieldCheck, ClipboardList,
  Server, AlertTriangle, CreditCard, Timer,
  Infinity, CalendarClock, Hash, Wifi
} from 'lucide-react'

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabsRow1 = [
    { id: 'overview', label: t('guide.tabs.overview'), icon: Book },
    { id: 'first-steps', label: t('guide.tabs.firstSteps'), icon: Play },
    { id: 'interface', label: t('guide.tabs.interface'), icon: Settings },
    { id: 'roles', label: t('guide.tabs.roles'), icon: Shield },
    { id: 'tips', label: t('guide.tabs.tips'), icon: Zap },
  ]

  const tabsRow2 = [
    { id: 'clients', label: t('guide.tabs.clients'), icon: UserPlus },
    { id: 'scan', label: t('guide.tabs.scan'), icon: QrCode },
    { id: 'lockers', label: t('guide.tabs.lockers'), icon: Lock },
    { id: 'architecture', label: t('guide.tabs.architecture'), icon: Server },
    { id: 'security', label: t('guide.tabs.security'), icon: ShieldCheck },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4">
                {t('guide.overview.welcome.title')}
              </h3>
              <p className="text-blue-800 mb-4">
                {t('guide.overview.welcome.description')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <Users className="h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">{t('guide.overview.cards.multiRoles.title')}</h4>
                  <p className="text-sm text-gray-600">{t('guide.overview.cards.multiRoles.description')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <ScanFace className="h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">{t('guide.overview.cards.scan.title')}</h4>
                  <p className="text-sm text-gray-600">{t('guide.overview.cards.scan.description')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <Smartphone className="h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">{t('guide.overview.cards.pwa.title')}</h4>
                  <p className="text-sm text-gray-600">{t('guide.overview.cards.pwa.description')}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('guide.overview.modules.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {([
                  { key: 'clients', icon: Users, color: 'green' },
                  { key: 'access', icon: DoorOpen, color: 'blue' },
                  { key: 'lockers', icon: Lock, color: 'yellow' },
                  { key: 'admin', icon: Settings, color: 'red' },
                ] as const).map((mod) => {
                  const Icon = mod.icon
                  const bgColor = mod.color === 'green' ? 'bg-green-100' :
                    mod.color === 'blue' ? 'bg-blue-100' :
                    mod.color === 'yellow' ? 'bg-yellow-100' : 'bg-red-100'
                  const textColor = mod.color === 'green' ? 'text-green-600' :
                    mod.color === 'blue' ? 'text-blue-600' :
                    mod.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  return (
                    <div key={mod.key} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${bgColor}`}>
                        <Icon className={`h-5 w-5 ${textColor}`} />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{t(`guide.overview.modules.${mod.key}.title`)}</h4>
                      <p className="text-sm text-gray-600">{t(`guide.overview.modules.${mod.key}.description`)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'first-steps':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">{t('guide.firstSteps.intro.title')}</h3>
              <p className="text-yellow-700">{t('guide.firstSteps.intro.description')}</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: t('guide.firstSteps.steps.0.title'),
                  description: t('guide.firstSteps.steps.0.description'),
                  details: [
                    t('guide.firstSteps.steps.0.details.0'),
                    t('guide.firstSteps.steps.0.details.1'),
                    t('guide.firstSteps.steps.0.details.2'),
                  ]
                },
                {
                  step: 2,
                  title: t('guide.firstSteps.steps.1.title'),
                  description: t('guide.firstSteps.steps.1.description'),
                  details: [
                    t('guide.firstSteps.steps.1.details.0'),
                    t('guide.firstSteps.steps.1.details.1'),
                    t('guide.firstSteps.steps.1.details.2'),
                  ]
                },
                {
                  step: 3,
                  title: t('guide.firstSteps.steps.2.title'),
                  description: t('guide.firstSteps.steps.2.description'),
                  details: [
                    t('guide.firstSteps.steps.2.details.0'),
                    t('guide.firstSteps.steps.2.details.1'),
                    t('guide.firstSteps.steps.2.details.2'),
                  ]
                },
                {
                  step: 4,
                  title: t('guide.firstSteps.steps.3.title'),
                  description: t('guide.firstSteps.steps.3.description'),
                  details: [
                    t('guide.firstSteps.steps.3.details.0'),
                    t('guide.firstSteps.steps.3.details.1'),
                    t('guide.firstSteps.steps.3.details.2'),
                  ]
                }
              ].map((item) => (
                <div key={item.step} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-gray-600 mb-3">{item.description}</p>
                      <ul className="space-y-1">
                        {item.details.map((detail, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'interface':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('guide.interface.title')}</h3>

              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">{t('guide.interface.sidebar.title')}</h4>
                <p className="text-gray-600 mb-4">
                  {t('guide.interface.sidebar.description')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['dashboard', 'clients', 'access', 'lockers', 'reports', 'admin'] as const).map((key) => (
                    <div key={key} className="bg-gray-50 p-3 rounded-lg">
                      <h5 className="font-medium text-gray-900">{t(`guide.interface.nav.${key}.name`)}</h5>
                      <p className="text-sm text-gray-600">{t(`guide.interface.nav.${key}.description`)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">{t('guide.interface.roleModules.title')}</h4>
                <p className="text-gray-600 mb-4">{t('guide.interface.roleModules.description')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <h5 className="font-medium text-green-800">{t('guide.interface.roleModules.receptionist.label')}</h5>
                    <p className="text-sm text-green-700">{t('guide.interface.roleModules.receptionist.modules')}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <h5 className="font-medium text-blue-800">{t('guide.interface.roleModules.agent.label')}</h5>
                    <p className="text-sm text-blue-700">{t('guide.interface.roleModules.agent.modules')}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <h5 className="font-medium text-red-800">{t('guide.interface.roleModules.admin.label')}</h5>
                    <p className="text-sm text-red-700">{t('guide.interface.roleModules.admin.modules')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'roles':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">{t('guide.roles.title')}</h3>
              <p className="text-blue-700">
                {t('guide.roles.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {([
                { key: 'receptionist', color: 'green', icon: User },
                { key: 'agent', color: 'blue', icon: ScanFace },
                { key: 'admin', color: 'red', icon: Shield },
              ] as const).map((roleInfo) => {
                const Icon = roleInfo.icon
                const bgColor = roleInfo.color === 'green' ? 'bg-green-100' :
                  roleInfo.color === 'blue' ? 'bg-blue-100' : 'bg-red-100'
                const textColor = roleInfo.color === 'green' ? 'text-green-600' :
                  roleInfo.color === 'blue' ? 'text-blue-600' : 'text-red-600'
                const checkColor = roleInfo.color === 'green' ? 'text-green-500' :
                  roleInfo.color === 'blue' ? 'text-blue-500' : 'text-red-500'
                const perms = [
                  t(`guide.roles.${roleInfo.key}.permissions.0`),
                  t(`guide.roles.${roleInfo.key}.permissions.1`),
                  t(`guide.roles.${roleInfo.key}.permissions.2`),
                  t(`guide.roles.${roleInfo.key}.permissions.3`),
                ]
                return (
                  <div key={roleInfo.key} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${bgColor}`}>
                      <Icon className={`h-6 w-6 ${textColor}`} />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-3">{t(`guide.roles.${roleInfo.key}.label`)}</h4>
                    <ul className="space-y-2">
                      {perms.map((perm, pIndex) => (
                        <li key={pIndex} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className={`h-4 w-4 mr-2 flex-shrink-0 ${checkColor}`} />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'tips':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">{t('guide.tips.intro.title')}</h3>
              <p className="text-green-700">
                {t('guide.tips.intro.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['bestPractices', 'security', 'efficiency', 'support'] as const).map((catKey) => (
                <div key={catKey} className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">{t(`guide.tips.categories.${catKey}.title`)}</h4>
                  <ul className="space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                      <li key={i} className="flex items-start text-sm text-gray-600">
                        <Zap className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                        {t(`guide.tips.categories.${catKey}.items.${i}`)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )

      case 'clients':
        return (
          <div className="space-y-8">
            {/* Créer un client */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.clientsTab.createClient.title')}</h3>
              </div>
              <p className="text-gray-600 mb-4">{t('guide.clientsTab.createClient.desc')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <h5 className="font-medium text-green-800 text-sm mb-1">Champs obligatoires</h5>
                  <p className="text-sm text-green-700">{t('guide.clientsTab.createClient.requiredFields')}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <h5 className="font-medium text-gray-700 text-sm mb-1">Champs optionnels</h5>
                  <p className="text-sm text-gray-600">{t('guide.clientsTab.createClient.optionalFields')}</p>
                </div>
              </div>
              <div className="flex items-start text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                <Cpu className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                {t('guide.clientsTab.createClient.auto')}
              </div>
              <div className="flex items-start text-sm text-purple-700 bg-purple-50 p-3 rounded-lg mt-2">
                <ScanFace className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                {t('guide.clientsTab.createClient.face')}
              </div>
            </div>

            {/* Carte de membre */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.clientsTab.memberCard.title')}</h3>
              </div>
              <p className="text-gray-600">{t('guide.clientsTab.memberCard.desc')}</p>
            </div>

            {/* Activités */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.clientsTab.activities.title')}</h3>
              </div>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-medium text-gray-700">Activité</th>
                      <th className="text-left py-2 pr-4 font-medium text-gray-700">Mode</th>
                      <th className="text-left py-2 pr-4 font-medium text-gray-700">Durée</th>
                      <th className="text-left py-2 font-medium text-gray-700">Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Équitation', 'Créneau horaire', '60 min', '2 000 DA'],
                      ['Piscine', 'Journée (réentrée)', '—', '800 DA'],
                      ['Tennis', 'Créneau horaire', '60 min', '1 000 DA'],
                      ['Padel', 'Créneau horaire', '60 min', '1 200 DA'],
                      ['Football', 'Créneau horaire', '90 min', '500 DA'],
                      ['Parc Attractions', 'Journée (réentrée)', '—', '600 DA'],
                      ['Paintball', 'Utilisation unique', '—', '1 500 DA'],
                      ['Stade de Tir', 'Utilisation unique', '—', '1 000 DA'],
                      ['Restaurant', 'Utilisation unique', '—', '0 DA'],
                      ['Cafétéria', 'Utilisation unique', '—', '0 DA'],
                      ['Espaces Verts', 'Journée (réentrée)', '—', '300 DA'],
                      ['Vestiaires', 'Journée (réentrée)', '—', '0 DA'],
                    ].map(([name, mode, duration, price], i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-medium text-gray-900">{name}</td>
                        <td className="py-2 pr-4 text-gray-600">{mode}</td>
                        <td className="py-2 pr-4 text-gray-600">{duration}</td>
                        <td className="py-2 text-gray-900 font-medium">{price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="font-semibold text-gray-900 mb-3">{t('guide.clientsTab.activities.modes.title')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {([
                  { key: 'single_use', icon: Ticket, color: 'red' },
                  { key: 'day_reentry', icon: DoorOpen, color: 'green' },
                  { key: 'time_slot', icon: Timer, color: 'blue' },
                  { key: 'unlimited', icon: Infinity, color: 'purple' },
                ] as const).map((m) => {
                  const Icon = m.icon
                  return (
                    <div key={m.key} className="bg-gray-50 p-3 rounded-lg flex items-start">
                      <Icon className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-${m.color}-500`} />
                      <p className="text-sm text-gray-700">{t(`guide.clientsTab.activities.modes.${m.key}`)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Plans d'abonnement */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <CalendarClock className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.clientsTab.plans.title')}</h3>
              </div>
              <div className="space-y-3">
                {(['temporal', 'usage', 'mixed'] as const).map((type) => (
                  <div key={type} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{t(`guide.clientsTab.plans.${type}`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tickets */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <Ticket className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.clientsTab.tickets.title')}</h3>
              </div>
              <p className="text-gray-600">{t('guide.clientsTab.tickets.desc')}</p>
            </div>
          </div>
        )

      case 'scan':
        return (
          <div className="space-y-8">
            {/* Scan Desktop + Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <QrCode className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('guide.scanTab.desktop.title')}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-2">{t('guide.scanTab.desktop.path')}</p>
                <p className="text-gray-600 text-sm">{t('guide.scanTab.desktop.desc')}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Smartphone className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('guide.scanTab.mobile.title')}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-2">{t('guide.scanTab.mobile.path')}</p>
                <p className="text-gray-600 text-sm">{t('guide.scanTab.mobile.desc')}</p>
              </div>
            </div>

            {/* Vérifications automatiques */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('guide.scanTab.checks.title')}</h3>
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs mr-3">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700">{t(`guide.scanTab.checks.items.${i}`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comportement par mode */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('guide.scanTab.validityBehavior.title')}</h3>
              <div className="space-y-3">
                {(['single_use', 'day_reentry', 'unlimited'] as const).map((mode) => {
                  const colors = mode === 'single_use' ? 'bg-red-50 text-red-700' :
                    mode === 'day_reentry' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'
                  return (
                    <div key={mode} className={`p-3 rounded-lg ${colors}`}>
                      <p className="text-sm font-medium">{t(`guide.scanTab.validityBehavior.${mode}`)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Résultats du scan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-800">AUTORISÉ</h4>
                </div>
                <p className="text-sm text-green-700">{t('guide.scanTab.results.granted')}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <h4 className="font-semibold text-red-800">REFUSÉ</h4>
                </div>
                <p className="text-sm text-red-700">{t('guide.scanTab.results.denied')}</p>
              </div>
            </div>

            {/* Vérification faciale */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center mb-3">
                <ScanFace className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-purple-900">{t('guide.scanTab.face.title')}</h3>
              </div>
              <p className="text-purple-800 text-sm">{t('guide.scanTab.face.desc')}</p>
            </div>

            {/* Historique */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <ClipboardList className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.scanTab.history.title')}</h3>
              </div>
              <p className="text-sm text-gray-600">{t('guide.scanTab.history.desc')}</p>
            </div>
          </div>
        )

      case 'lockers':
        return (
          <div className="space-y-8">
            {/* Zones */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('guide.lockersTab.zones.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {(['a', 'b', 'c'] as const).map((zone) => {
                  const colors = zone === 'a' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                    zone === 'b' ? 'bg-green-50 border-green-200 text-green-800' :
                    'bg-orange-50 border-orange-200 text-orange-800'
                  return (
                    <div key={zone} className={`p-4 rounded-lg border ${colors}`}>
                      <p className="font-medium text-sm">{t(`guide.lockersTab.zones.${zone}`)}</p>
                    </div>
                  )
                })}
              </div>
              <h4 className="font-medium text-gray-900 mb-3">Statuts visuels</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {([
                  { key: 'available', color: 'bg-green-400' },
                  { key: 'occupied', color: 'bg-red-400' },
                  { key: 'maintenance', color: 'bg-orange-400' },
                  { key: 'out_of_order', color: 'bg-gray-400' },
                ] as const).map((s) => (
                  <div key={s.key} className="flex items-center bg-gray-50 p-2 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${s.color} mr-2`} />
                    <span className="text-sm text-gray-700">{t(`guide.lockersTab.statuses.${s.key}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Opérations */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('guide.lockersTab.operations.title')}</h3>
              <div className="space-y-3">
                {(['assign', 'release', 'maintenance', 'lost'] as const).map((op) => (
                  <div key={op} className="flex items-start bg-gray-50 p-3 rounded-lg">
                    <Lock className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{t(`guide.lockersTab.operations.${op}`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RFID */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <Wifi className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.lockersTab.rfid.title')}</h3>
              </div>
              <div className="space-y-3">
                {(['register', 'assign', 'deactivate', 'reactivate', 'replace'] as const).map((op) => (
                  <div key={op} className="flex items-start bg-gray-50 p-3 rounded-lg">
                    <Hash className="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{t(`guide.lockersTab.rfid.${op}`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'architecture':
        return (
          <div className="space-y-8">
            {/* Stack */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('guide.architectureTab.stack.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(['frontend', 'backend', 'database', 'auth', 'desktop', 'qr', 'face', 'ui'] as const).map((key) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-medium text-gray-900 text-sm">{t(`guide.architectureTab.stack.items.${key}.label`)}</h5>
                    <p className="text-sm text-gray-600">{t(`guide.architectureTab.stack.items.${key}.value`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mode hybride */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">{t('guide.architectureTab.mode.title')}</h3>
              <div className="space-y-3">
                {(['desktop', 'mobile', 'cert', 'db'] as const).map((key) => (
                  <div key={key} className="flex items-start">
                    <Server className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{t(`guide.architectureTab.mode.${key}`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Schéma architecture */}
            <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono text-xs leading-relaxed overflow-x-auto">
              <pre>{`┌───────────────────────────────┐
│     Application Electron      │  ◄── Bureau (réception, admin)
│     (BrowserWindow)           │
└──────────┬────────────────────┘
           │
           ▼
┌──────────┴────────────────────┐
│     Serveur Next.js           │  ◄── Port 4567 (HTTPS auto-signé)
│     (standalone intégré)      │
└──────────┬────────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────┐
│ MongoDB │  │  Agents   │  ◄── Mobiles/tablettes sur le LAN
│  local  │  │  PWA scan │      https://<ip>:4567/agent
└─────────┘  └──────────┘`}</pre>
            </div>

            {/* Installation */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('guide.architectureTab.setup.title')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('guide.architectureTab.setup.prereqs')}</p>
              <p className="text-sm text-gray-600 mb-4">{t('guide.architectureTab.setup.wizard')}</p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <h4 className="font-medium text-yellow-800 text-sm">{t('guide.architectureTab.setup.accounts.title')}</h4>
                </div>
                <p className="text-xs text-yellow-700 mb-3">{t('guide.architectureTab.setup.accounts.warning')}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-yellow-200">
                        <th className="text-left py-1 pr-4 font-medium text-yellow-800">Email</th>
                        <th className="text-left py-1 pr-4 font-medium text-yellow-800">Mot de passe</th>
                        <th className="text-left py-1 font-medium text-yellow-800">Rôle</th>
                      </tr>
                    </thead>
                    <tbody className="text-yellow-700">
                      <tr><td className="py-1 pr-4">admin@park.demo</td><td className="py-1 pr-4">Admin@123456</td><td className="py-1">Administrateur</td></tr>
                      <tr><td className="py-1 pr-4">accueil@park.demo</td><td className="py-1 pr-4">Agent@123456</td><td className="py-1">Agent d&apos;accueil</td></tr>
                      <tr><td className="py-1 pr-4">attraction@park.demo</td><td className="py-1 pr-4">Agent@123456</td><td className="py-1">Agent attraction</td></tr>
                      <tr><td className="py-1 pr-4">superviseur@park.demo</td><td className="py-1 pr-4">Super@123456</td><td className="py-1">Superviseur</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-8">
            {/* Authentification */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Lock className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.securityTab.auth.title')}</h3>
              </div>
              <ul className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {t(`guide.securityTab.auth.items.${i}`)}
                  </li>
                ))}
              </ul>
            </div>

            {/* RBAC */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.securityTab.rbac.title')}</h3>
              </div>
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-start bg-blue-50 p-3 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs mr-3">
                      {i + 1}
                    </div>
                    <p className="text-sm text-blue-800">{t(`guide.securityTab.rbac.items.${i}`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Headers HTTP */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <Server className="h-5 w-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.securityTab.headers.title')}</h3>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 space-y-1">
                {[0, 1, 2, 3].map((i) => (
                  <p key={i}>{t(`guide.securityTab.headers.items.${i}`)}</p>
                ))}
              </div>
            </div>

            {/* QR Security */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <QrCode className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('guide.securityTab.qrSecurity.title')}</h3>
              </div>
              <ul className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center text-sm text-gray-600">
                    <ShieldCheck className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                    {t(`guide.securityTab.qrSecurity.items.${i}`)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Audit */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
              <div className="flex items-center mb-3">
                <ClipboardList className="h-6 w-6 text-orange-600 mr-2" />
                <h3 className="text-lg font-semibold text-orange-900">{t('guide.securityTab.audit.title')}</h3>
              </div>
              <p className="text-orange-800 text-sm mb-3">{t('guide.securityTab.audit.desc')}</p>
              <p className="text-orange-700 text-xs mb-2">{t('guide.securityTab.audit.modules')}</p>
              <p className="text-orange-700 text-xs">{t('guide.securityTab.audit.filters')}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          <Book className="inline-block h-10 w-10 mr-3 text-blue-600" />
          {t('guide.title')}
        </h1>
        <p className="text-xl text-gray-600">
          {t('guide.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          {/* Ligne 1 : Prise en main */}
          <nav className="flex space-x-6 px-6 overflow-x-auto">
            {tabsRow1.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
          {/* Ligne 2 : Modules détaillés */}
          <nav className="flex space-x-6 px-6 overflow-x-auto border-t border-gray-100">
            {tabsRow2.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
