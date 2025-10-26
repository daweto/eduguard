import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GuardianCreateForm } from "@/components/guardians/GuardianCreateForm";
import { useGuardians } from "@/components/guardians/hooks/useGuardians";
import { toast } from "sonner";

export default function GuardiansCreatePage() {
  const { t } = useTranslation(["guardians"]);
  const navigate = useNavigate();
  const { create } = useGuardians();

  const handleCreateSuccess = async () => {
    toast.success(t("guardians:messages.createSuccess"));
    // Navigate to guardians list after successful creation
    navigate("/guardians/list");
  };

  const handleCreateError = (error: Error) => {
    console.error("Failed to create guardian:", error);
    toast.error(t("guardians:messages.createError"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("guardians:createPage.title")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("guardians:createPage.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("guardians:createPage.cardTitle")}</CardTitle>
          <CardDescription>
            {t("guardians:createPage.cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GuardianCreateForm
            onSuccess={handleCreateSuccess}
            onError={handleCreateError}
            onSubmit={async (data) => {
              await create(data);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
