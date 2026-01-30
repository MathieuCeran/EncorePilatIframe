"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SubmitButton } from "./SubmitButton";
import { ErrorMessage } from "./ErrorMessage";
import { Mail } from "lucide-react";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Utiliser notre nouveau endpoint API au lieu de Supabase Auth
      const response = await fetch("/api/auth/send-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Gestion des erreurs spécifiques retournées par notre API
        switch (response.status) {
          case 400:
            if (result.error.includes("Format")) {
              setError("Format d'email invalide");
            } else if (result.error.includes("confirmer")) {
              setError("Veuillez d'abord confirmer votre compte");
            } else {
              setError("Données invalides");
            }
            break;
          case 409:
            setError("Ce compte est déjà confirmé mais introuvable");
            break;
          case 500:
            setError("Erreur serveur. Veuillez réessayer plus tard");
            break;
          default:
            setError(result.error || "Une erreur s'est produite");
        }
      } else {
        setSuccess(true);
        toast.success("Email de réinitialisation envoyé !", {
          description:
            "Vérifiez votre boîte de réception et suivez les instructions.",
          icon: "📧",
          duration: 5000,
        });
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      setError(
        "Une erreur de connexion s'est produite. Vérifiez votre connexion internet."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col flex-grow">
        <div className="mb-6 mt-16 text-center">
          <div className="mb-4 flex justify-center">
            <Mail className="w-16 h-16 text-marron" />
          </div>
          <h3 className="text-xl font-aboreto text-marron mb-4">
            Email envoyé !
          </h3>
          <p className="text-gray-600 font-chillax leading-relaxed">
            Nous avons envoyé un lien de réinitialisation à{" "}
            <span className="font-semibold text-marron">{email}</span>
          </p>
          <p className="text-gray-500 text-sm mt-4 font-chillax">
            Vérifiez votre boîte de réception et suivez les instructions.
          </p>
          <p className="text-gray-400 text-xs mt-2 font-chillax">
            Si vous ne voyez pas l&apos;email, vérifiez vos spams.
          </p>
        </div>

        <div className="flex-grow flex flex-col justify-end">
          <Link
            href="/signin"
            className="w-full bg-encoregreen text-white py-4 px-6 rounded-full text-lg font-chillax hover:bg-encoregreen/80 transition-colors duration-200 text-center"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
      <div className="mb-6 mt-16">
        <label
          htmlFor="email"
          className="block text-xl mb-3 font-[400] tracking-wide font-aboreto text-marron"
        >
          VOTRE EMAIL
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-6 py-4 rounded-full border border-marron/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-encoregreen text-lg font-chillax placeholder-gray-400"
          placeholder="votre@email.com"
        />
      </div>

      <div className="mb-6">
        <p className="text-gray-600 text-sm font-chillax leading-relaxed">
          Entrez votre adresse email et nous vous enverrons un lien pour
          réinitialiser votre mot de passe.
        </p>
      </div>

      <ErrorMessage error={error} />

      <div className="flex-grow flex flex-col justify-end">
        <SubmitButton loading={loading} text="Envoyer le lien" />

        <div className="text-center text-gray-500 italic text-sm font-inter-extralight-italic mt-4">
          Vous vous souvenez de votre mot de passe ? &nbsp;
          <Link
            href="/signin"
            className="underline hover:text-marron transition-colors duration-200"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </form>
  );
}
