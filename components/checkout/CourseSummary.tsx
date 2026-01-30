import React from "react";
import { Clock, User, Zap } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FormattedCourse } from "@/types/types";

interface CourseSummaryProps {
  course: FormattedCourse;
  isMobile?: boolean;
}

export const CourseSummary: React.FC<CourseSummaryProps> = ({
  course,
  isMobile = false,
}) => {
  if (!course) return null;

  const containerClass = isMobile ? "p-6 " : "p-6 rounded-[24px]";

  const titleClass = isMobile
    ? "font-chillax text-lg text-marron leading-tight"
    : "font-chillax text-base text-marron";

  const iconSize = isMobile ? "h-5 w-5" : "h-4 w-4";
  const textSize = isMobile ? "text-sm" : "text-sm";

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-encoregreen/10 rounded-full">
          <Zap className={`${iconSize} text-encoregreen`} />
        </div>
        <span className="font-chillax text-base text-marron font-medium">
          Cours sélectionné
        </span>
      </div>

      <div className={isMobile ? "space-y-3" : ""}>
        <h3 className={titleClass}>{course.name}</h3>

        <div
          className={`flex items-center gap-3 ${textSize} text-marron ${isMobile ? "" : "mt-2"}`}
        >
          <Clock className={`${iconSize} text-marron`} />
          <span className="font-medium">
            {format(new Date(course.date + "T00:00:00"), "EEEE, dd MMMM", { locale: fr })} – {course.startTime}/{course.endTime}
          </span>
        </div>

        <div
          className={`flex items-center gap-3 ${textSize} text-marron ${isMobile ? "" : "mt-1"}`}
        >
          <User className={`${iconSize} text-marron`} />
          <span className="font-medium">{course.instructor}</span>
        </div>
      </div>
    </div>
  );
};
