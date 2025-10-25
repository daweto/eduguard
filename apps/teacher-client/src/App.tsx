import { useState } from 'react';
import { EnrollmentForm } from '@/components/EnrollmentForm';
import { StudentRoster } from '@/components/StudentRoster';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Users, GraduationCap } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'enroll' | 'roster'>('enroll');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEnrollmentSuccess = () => {
    // Refresh the roster after successful enrollment
    setRefreshTrigger(prev => prev + 1);
    // Optionally switch to roster tab
    setTimeout(() => {
      setActiveTab('roster');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">EduGuard</h1>
              <p className="text-sm text-muted-foreground">
                AI-Powered Student Enrollment & Safety
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <Button
              variant={activeTab === 'enroll' ? 'default' : 'ghost'}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary h-12"
              data-active={activeTab === 'enroll'}
              onClick={() => setActiveTab('enroll')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Enroll Student
            </Button>
            <Button
              variant={activeTab === 'roster' ? 'default' : 'ghost'}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary h-12"
              data-active={activeTab === 'roster'}
              onClick={() => setActiveTab('roster')}
            >
              <Users className="w-4 h-4 mr-2" />
              View Roster
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'enroll' ? (
          <div className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Student Enrollment</h2>
                <p className="text-muted-foreground">
                  Enroll new students by uploading 1-3 portrait photos for facial recognition.
                  The system will automatically index their faces for future attendance tracking.
                </p>
              </div>
              <EnrollmentForm onSuccess={handleEnrollmentSuccess} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Student Roster</h2>
              <p className="text-muted-foreground">
                View all enrolled students and their guardian information.
              </p>
            </div>
            <StudentRoster refreshTrigger={refreshTrigger} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              EduGuard © {new Date().getFullYear()} - AI-Powered Attendance & Safety System
            </p>
            <p>
              Feature 1 (F1): Student Enrollment with AWS Rekognition
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
