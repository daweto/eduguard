import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentsPage() {
  const { t } = useTranslation(['students'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('students:page.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('students:page.description')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t('students:cards.enroll.title')}
            </CardTitle>
            <CardDescription>
              {t('students:cards.enroll.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full"><Link to="/students/enroll">{t('students:cards.enroll.action')}</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('students:cards.roster.title')}
            </CardTitle>
            <CardDescription>
              {t('students:cards.roster.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full"><Link to="/students/roster">{t('students:cards.roster.action')}</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('students:cards.grades.title')}
            </CardTitle>
            <CardDescription>
              {t('students:cards.grades.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full"><Link to="/students/grades">{t('students:cards.grades.action')}</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

