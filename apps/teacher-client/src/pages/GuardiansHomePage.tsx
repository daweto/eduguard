import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

export default function GuardiansHomePage() {
  const { t } = useTranslation(["guardians"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("guardians:page.title")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("guardians:page.description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              {t("guardians:cards.list.title")}
            </CardTitle>
            <CardDescription>
              {t("guardians:cards.list.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/guardians/list">
                {t("guardians:cards.list.action")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("guardians:cards.create.title")}
            </CardTitle>
            <CardDescription>
              {t("guardians:cards.create.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/guardians/create">
                {t("guardians:cards.create.action")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
