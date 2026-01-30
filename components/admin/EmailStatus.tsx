import React, { useState } from "react";
import { toast } from "sonner";

interface EmailStatusProps {
  commandeId: string;
  emailSent: boolean | null;
  emailSentAt: string | null;
  emailError: string | null;
  onEmailResent?: () => void;
}

export default function EmailStatus({
  commandeId,
  emailSent,
  emailSentAt,
  emailError,
  onEmailResent,
}: EmailStatusProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const response = await fetch(
        `/api/admin/commandes/${commandeId}/resend-email`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Emails renvoyés avec succès", {
          icon: "✅",
          duration: 3000,
        });
        onEmailResent?.();
      } else {
        toast.error(data.message || "Erreur lors du renvoi des emails", {
          icon: "❌",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Erreur lors du renvoi des emails:", error);
      toast.error("Erreur lors du renvoi des emails", {
        icon: "❌",
        duration: 3000,
      });
    } finally {
      setIsResending(false);
    }
  };

  // Si email envoyé avec succès
  if (emailSent === true) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-green-600 text-sm">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Envoyé</span>
        </div>
        {emailSentAt && (
          <span className="text-xs text-gray-500">
            {new Date(emailSentAt).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    );
  }

  // Si email non envoyé ou erreur
  if (emailSent === false || emailError) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-red-600 text-sm">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>Non envoyé</span>
          </div>
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="px-2 py-1 text-xs bg-encoregreen text-white rounded-md hover:bg-encoregreen/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Renvoyer les emails"
          >
            {isResending ? (
              <span className="flex items-center gap-1">
                <svg
                  className="animate-spin h-3 w-3"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Envoi...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Renvoyer
              </span>
            )}
          </button>
        </div>
        {emailError && (
          <span className="text-xs text-red-500" title={emailError}>
            {emailError.length > 50
              ? `${emailError.substring(0, 50)}...`
              : emailError}
          </span>
        )}
      </div>
    );
  }

  // Statut inconnu (null)
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-gray-400 text-sm">
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <span>Inconnu</span>
      </div>
      <button
        onClick={handleResendEmail}
        disabled={isResending}
        className="px-2 py-1 text-xs bg-encoregreen text-white rounded-md hover:bg-encoregreen/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Envoyer les emails"
      >
        {isResending ? "Envoi..." : "Envoyer"}
      </button>
    </div>
  );
}
