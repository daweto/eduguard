import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { StudentEnrollmentForm } from "@/components/students/StudentEnrollmentForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function EnrollStudentPage() {
  const { t } = useTranslation("enrollment");
  const navigate = useNavigate();

  const handleEnrollmentSuccess = () => {
    toast.success(t("messages.success"));
    // Redirect to roster page after a brief delay to show the toast
    setTimeout(() => {
      navigate("/students/roster");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> {t("title")}
        </h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <div className="max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentEnrollmentForm onSuccess={handleEnrollmentSuccess} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
