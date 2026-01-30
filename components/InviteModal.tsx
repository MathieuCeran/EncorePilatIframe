"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, MessageCircle, X } from "lucide-react";
import { FormattedCourse } from "@/types/types";
import { toast } from "sonner";

interface InviteModalProps {
  course: FormattedCourse;
  selectedDate: Date;
  size?: "sm" | "md";
  className?: string;
}

export function InviteModal({
  course,
  selectedDate,
  size = "sm",
  className = "",
}: InviteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const generateInviteText = () => {
    const formattedDate = format(selectedDate, "EEEE dd MMMM", { locale: fr });
    return `Salut ! Je t'invite à rejoindre le cours "${course.name?.toUpperCase() || "COURS"}" le ${formattedDate} de ${course.startTime} à ${course.endTime} avec ${course.instructor} chez Encore Pilate ! 🧘‍♀️✨

Rendez-vous sur : https://encorepilate.ma

À bientôt ! 💪`;
  };

  const handleEmailShare = () => {
    const subject = `Invitation cours Encore Pilate - ${course.name}`;
    const body = generateInviteText();
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(mailtoLink, "_blank");
    setIsOpen(false);
    toast.success("Application email ouverte !");
  };

  const handleWhatsAppShare = () => {
    const text = generateInviteText();
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(whatsappLink, "_blank");
    setIsOpen(false);
    toast.success("WhatsApp ouvert !");
  };

  const buttonSizeClass =
    size === "sm" ? "text-xs px-3 py-1" : "text-sm px-4 py-2";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`
          inline-flex items-center gap-1 rounded-full border border-marron bg-darkBeige2 text-marron 
          hover:bg-darkBeige2/80 transition-colors font-ttdrugs
          ${buttonSizeClass} ${className}
        `}
      >
        Invite
      </button>

      {/* Modal Portal - Rendu dans le body pour couvrir toute l'app */}
      {isOpen &&
        isMounted &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/20 flex items-center justify-center z-[9999]"
            onClick={() => setIsOpen(false)}
          >
            {/* Modal Content */}
            <div
              className="bg-white rounded-2xl p-6 max-w-sm mx-4 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="mb-6">
                <h3 className="text-lg font-playfair font-semibold text-gray-900 mb-2">
                  Partager ce cours
                </h3>
                <p className="text-sm text-gray-600 font-ttdrugs">
                  {course.name?.toUpperCase()} •{" "}
                  {format(selectedDate, "EEEE dd MMMM", { locale: fr })}
                </p>
              </div>

              {/* Share Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleEmailShare}
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-ttdrugs"
                >
                  <Mail className="w-5 h-5" />
                  Email
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors font-ttdrugs"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
