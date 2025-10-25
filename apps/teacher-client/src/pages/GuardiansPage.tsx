import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GuardianCreateForm } from '@/components/guardians/GuardianCreateForm';
import { GuardiansList } from '@/components/guardians/GuardiansList';
import { useGuardians } from '@/components/guardians/hooks/useGuardians';
import { Shield } from 'lucide-react';

export default function GuardiansPage() {
  const { t } = useTranslation('guardians');
  const { guardians, loading, error, create } = useGuardians();

  const handleCreateSuccess = async () => {
    // Guardian is automatically added to the list via the hook
  };

  const handleCreateError = (error: Error) => {
    console.error('Failed to create guardian:', error);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" /> {t('title')}
        </h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.title')}</CardTitle>
          <CardDescription>{t('form.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <GuardianCreateForm
            onSuccess={handleCreateSuccess}
            onError={handleCreateError}
            onSubmit={async (data) => {
              await create(data);
            }}
          />
          {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('table.title')}</CardTitle>
          <CardDescription>{t('table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <GuardiansList guardians={guardians} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
