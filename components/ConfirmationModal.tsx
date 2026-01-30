"use client";

import React from "react";
import { X, AlertTriangle, Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Reservation = {
  id: string;
  status: string;
  created_at: string;
  course: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    course_type: { id: string; name: string };
    instructor?: {
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  };
};

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reservation: Reservation | null;
  loading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  reservation,
  loading = false,
}: ConfirmationModalProps) {
  if (!isOpen || !reservation) return null;

  const courseDate = format(
    new Date(reservation.course.date),
    "EEEE, dd MMMM",
    {
      locale: fr,
    }
  );
  const courseTime = `${reservation.course.start_time} - ${reservation.course.end_time}`;
  const instructor = reservation.course.instructor
    ? `${reservation.course.instructor.first_name || ""} ${reservation.course.instructor.last_name || ""}`.trim()
    : "Encore Studio";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Annuler la réservation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Êtes-vous sûr de vouloir annuler votre réservation ? Cette action ne
            peut pas être annulée.
          </p>

          {/* Course Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              {reservation.course.course_type.name}
            </h4>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{courseDate}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{courseTime}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{instructor}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>Important :</strong> L&apos;annulation doit être
                effectuée au moins 12h avant le début du cours.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Annulation...
              </div>
            ) : (
              "Confirmer l'annulation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
