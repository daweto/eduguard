/**
 * List/table component for displaying guardians
 */

import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { LegalGuardian } from '@/types/guardian';
import { formatFullName } from '@/lib/helpers/format';

interface GuardiansListProps {
  guardians: LegalGuardian[];
  loading?: boolean;
}

export function GuardiansList({ guardians, loading }: GuardiansListProps) {
  const { t } = useTranslation('guardians');

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (guardians.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('table.empty')}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table.headers.name')}</TableHead>
          <TableHead>{t('table.headers.identification')}</TableHead>
          <TableHead>{t('table.headers.phone')}</TableHead>
          <TableHead>{t('table.headers.email')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {guardians.map((guardian) => (
          <TableRow key={guardian.id}>
            <TableCell>{formatFullName(guardian)}</TableCell>
            <TableCell>{guardian.identificationNumber}</TableCell>
            <TableCell>{guardian.phone}</TableCell>
            <TableCell>{guardian.email}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
