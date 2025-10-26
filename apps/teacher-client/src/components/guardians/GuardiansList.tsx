/**
 * List/table component for displaying guardians
 */

import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { LegalGuardian } from '@/types/guardian';
import { GuardiansDataTable } from './guardians-data-table';
import { createGuardianColumns } from './guardian-columns';

interface GuardiansListProps {
  guardians: LegalGuardian[];
  loading?: boolean;
}

export function GuardiansList({ guardians, loading }: GuardiansListProps) {
  // Create columns (must be before early returns)
  const columns = useMemo(() => createGuardianColumns(), []);

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

  return <GuardiansDataTable columns={columns} data={guardians} />;
}
