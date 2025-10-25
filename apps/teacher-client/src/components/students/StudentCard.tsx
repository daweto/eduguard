import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import type { Student } from '@/types/student';
import { User, Phone, Mail, GraduationCap, Trash2, IdCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface StudentCardProps {
  student: Student;
  onDelete?: (id: string) => void;
}

export function StudentCard({ student, onDelete }: StudentCardProps) {
  const { t } = useTranslation('roster');
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const photos = student.photo_urls || [];

  const studentFullName = [
    student.firstName,
    student.middleName?.trim() ? student.middleName : null,
    student.lastName,
    student.secondLastName?.trim() ? student.secondLastName : null,
  ]
    .filter(Boolean)
    .join(' ');

  const guardianSource = student.guardian ?? null;
  const guardianFullName = guardianSource
    ? [
        guardianSource.firstName,
        guardianSource.middleName?.trim() ? guardianSource.middleName : null,
        guardianSource.lastName,
        guardianSource.secondLastName?.trim() ? guardianSource.secondLastName : null,
      ].filter(Boolean).join(' ')
    : student.guardianName;

  // Track carousel state
  useEffect(() => {
    if (!carouselApi) return;

    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap());

    carouselApi.on('select', () => {
      setCurrent(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {/* Photo carousel section */}
        {photos.length > 0 ? (
          <div className="relative">
            <Carousel
              setApi={setCarouselApi}
              opts={{
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {photos.map((photoUrl, index) => (
                  <CarouselItem key={index}>
                    <div className="relative h-48 bg-muted">
                      <img
                        src={photoUrl}
                        alt={`${studentFullName} - Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Replace with placeholder if image fails to load
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            e.currentTarget.style.display = 'none';
                            parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gradient-to-br', 'from-primary/20', 'to-primary/5');
                            const placeholder = document.createElement('div');
                            placeholder.innerHTML = '<svg class="w-20 h-20 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                            parent.appendChild(placeholder.firstElementChild!);
                          }
                        }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Navigation buttons (only show if multiple photos) */}
              {photos.length > 1 && (
                <>
                  <CarouselPrevious className="left-2 bg-black/50 text-white hover:bg-black/70 border-0" />
                  <CarouselNext className="right-2 bg-black/50 text-white hover:bg-black/70 border-0" />
                </>
              )}
            </Carousel>

            {/* Photo indicators (only show if multiple photos) */}
            {photos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {Array.from({ length: count }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === current ? 'bg-white w-4' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <ImagePlaceholder
            className="h-48"
            name={studentFullName}
          />
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Student name */}
        <div>
          <h3 className="text-xl font-semibold truncate">{studentFullName}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <IdCard className="w-4 h-4" />
            <span>{student.identificationNumber}</span>
          </div>
          {(student.gradeDisplayName || student.gradeId) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <GraduationCap className="w-4 h-4" />
              <span>{student.gradeDisplayName ?? student.gradeId}</span>
            </div>
          )}
        </div>

        {/* Guardian info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">{t('studentCard.guardian')}</p>
              <p className="font-medium">{guardianFullName}</p>
            </div>
          </div>

          {guardianSource && (
            <div className="flex items-start gap-2">
              <IdCard className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">{t('studentCard.identification')}</p>
                <p className="font-medium">{guardianSource.identificationNumber}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">{t('studentCard.phone')}</p>
              <p className="font-medium">{guardianSource?.phone ?? student.guardianPhone}</p>
            </div>
          </div>

          {(guardianSource?.email ?? student.guardianEmail) && (
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">{t('studentCard.email')}</p>
                <p className="font-medium truncate">{guardianSource?.email ?? student.guardianEmail}</p>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-3 border-t text-xs text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>{t('studentCard.enrolled')}: {new Date(student.enrollmentDate).toLocaleDateString()}</span>
            <span className="text-green-600 dark:text-green-400 font-medium">{t('studentCard.active')}</span>
          </div>
          {student.face_ids && student.face_ids.length > 0 && (
            <div className="mt-1">
              {t('studentCard.facesIndexed', { count: student.face_ids.length })}
            </div>
          )}
        </div>

        {/* Delete button (optional) */}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full mt-2"
            onClick={() => onDelete(student.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('studentCard.removeStudent')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
