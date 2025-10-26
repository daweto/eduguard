import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GuardianCreateForm } from "@/components/guardians/GuardianCreateForm";
import { GuardiansList } from "@/components/guardians/GuardiansList";
import { useGuardians } from "@/components/guardians/hooks/useGuardians";
import { Shield, Plus } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function GuardiansPage() {
  const { t } = useTranslation("guardians");
  const { guardians, loading, create } = useGuardians();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = async (data: Parameters<typeof create>[0]) => {
    await create(data);
  };

  const handleCreateSuccess = async () => {
    // Guardian is automatically added to the list via the hook
    setDialogOpen(false);
  };

  const handleCreateError = (error: Error) => {
    console.error("Failed to create guardian:", error);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" /> {t("page.title")}
        </h2>
        <p className="text-muted-foreground">{t("page.description")}</p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t("actions.create")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dialog.create.title")}</DialogTitle>
            <DialogDescription>
              {t("dialog.create.description")}
            </DialogDescription>
          </DialogHeader>
          <GuardianCreateForm
            onSubmit={handleSubmit}
            onSuccess={handleCreateSuccess}
            onError={handleCreateError}
          />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{t("table.title")}</CardTitle>
          <CardDescription>{t("table.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <GuardiansList guardians={guardians} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
