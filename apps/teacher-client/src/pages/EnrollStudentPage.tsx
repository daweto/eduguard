import { useTranslation } from 'react-i18next';
import { StudentEnrollmentForm } from '@/components/students/StudentEnrollmentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

export default function EnrollStudentPage() {
  const { t } = useTranslation('enrollment');

  const handleEnrollmentSuccess = () => {
    // no-op for now; roster page can refetch on mount
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> {t('title')}
        </h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <div className="max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentEnrollmentForm onSuccess={handleEnrollmentSuccess} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
