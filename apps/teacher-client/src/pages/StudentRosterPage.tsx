import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StudentRoster } from '@/components/students/StudentRoster';
import { Users } from 'lucide-react';

export default function StudentRosterPage() {
  const { t } = useTranslation('roster');
  const [refreshTrigger] = useState(0);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Users className="w-5 h-5" /> {t('title')}
        </h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <StudentRoster refreshTrigger={refreshTrigger} />
    </div>
  );
}
