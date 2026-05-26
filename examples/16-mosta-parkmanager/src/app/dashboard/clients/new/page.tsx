// Author: Dr Hamid MADANI drmdh@msn.com
import ClientForm from '@/components/clients/ClientForm'
import { t } from '@/i18n'

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('clients.create')}</h1>
      <ClientForm />
    </div>
  )
}
