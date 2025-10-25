import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LegalGuardian } from '@/types/guardian';
import { createGuardian, getGuardians, ApiError } from '@/lib/api';

export default function Guardians() {
  const { t } = useTranslation('guardians');
  const [guardians, setGuardians] = useState<LegalGuardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGuardians();
      setGuardians(res.guardians);
      setError(null);
    } catch {
      setError(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      await createGuardian({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined });
      setName('');
      setPhone('');
      setEmail('');
      await load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('messages.createError');
      setError(`${t('messages.createError')}${e instanceof ApiError ? `: ${msg}` : ''}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">{t('form.name.label')} *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('form.name.placeholder')} />
            </div>
            <div>
              <label className="block text-sm mb-1">{t('form.phone.label')} *</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('form.phone.placeholder')} />
            </div>
            <div>
              <label className="block text-sm mb-1">{t('form.email.label')}</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('form.email.placeholder')} />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={submitting || !name.trim() || !phone.trim()}>
                {submitting ? t('form.submitting') : t('form.submit')}
              </Button>
            </div>
          </form>
          {error && <div className="mt-3 text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('table.title')}</CardTitle>
          <CardDescription>{t('table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">{t('table.loading')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.headers.name')}</TableHead>
                  <TableHead>{t('table.headers.phone')}</TableHead>
                  <TableHead>{t('table.headers.email')}</TableHead>
                  <TableHead>{t('table.headers.language')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guardians.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>{g.phone}</TableCell>
                    <TableCell>{g.email ?? '-'}</TableCell>
                    <TableCell>{g.preferredLanguage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


