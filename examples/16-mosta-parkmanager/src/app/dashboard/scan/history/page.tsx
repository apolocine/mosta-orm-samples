// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Loader2 } from 'lucide-react'
import { t } from '@/i18n'

export default function ScanHistoryPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: async () => {
      const res = await fetch('/api/scan/history')
      if (!res.ok) throw new Error('Erreur')
      return (await res.json()).data
    },
    refetchInterval: 10000,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('scan.history')}</h1>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>Scanné par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.ticket?.ticketNumber || '-'}
                    </TableCell>
                    <TableCell>{log.ticket?.clientName || '-'}</TableCell>
                    <TableCell>{log.ticket?.activityName || '-'}</TableCell>
                    <TableCell>
                      <Badge className={log.result === 'granted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} variant="secondary">
                        {log.result === 'granted' ? 'Accordé' : 'Refusé'}
                      </Badge>
                      {log.denyReason && (
                        <span className="text-xs text-red-500 ml-1">
                          ({t(`scan.denyReasons.${log.denyReason}`)})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.scannedBy?.firstName} {log.scannedBy?.lastName}
                    </TableCell>
                  </TableRow>
                ))}
                {logs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      Aucun scan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
