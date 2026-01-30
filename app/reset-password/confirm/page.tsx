"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import CardVertical from "@/components/ui/cardVertical";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorMessage } from "@/components/ErrorMessage";
import CheckIcon from "@/components/ui/CheckIcon";

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Vérifier le token de réinitialisation depuis sessionStorage ou session Supabase
    const checkResetAuth = async () => {
      // D'abord vérifier nos tokens personnalisés
      const customToken = sessionStorage.getItem("reset_token");
      const customEmail = sessionStorage.getItem("reset_email");

      if (customToken && customEmail) {
        return; // Token personnalisé trouvé, continuer
      }

      // Fallback: vérifier session Supabase
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/reset-password");
        toast.error("Lien de réinitialisation invalide ou expiré", {
          icon: "⚠️",
          duration: 3000,
        });
        return;
      }

      // Si session Supabase, l'email sera géré automatiquement
    };

    checkResetAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    try {
      // Vérifier si on utilise un token personnalisé
      const customToken = sessionStorage.getItem("reset_token");

      if (customToken) {
        // Utiliser notre API personnalisée
        const response = await fetch("/api/auth/reset-password-with-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: customToken,
            newPassword: password,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(
            result.error || "Erreur lors de la mise à jour du mot de passe"
          );
          setLoading(false);
          return;
        }

        // Nettoyer le sessionStorage
        sessionStorage.removeItem("reset_token");
        sessionStorage.removeItem("reset_email");

        setSuccess(true);
        toast.success("Mot de passe mis à jour avec succès !", {
          icon: "✅",
          duration: 3000,
        });
      } else {
        // Fallback: utiliser Supabase directement
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) {
          setError(
            "Une erreur s'est produite lors de la mise à jour du mot de passe"
          );
        } else {
          setSuccess(true);
          toast.success("Mot de passe mis à jour avec succès !", {
            icon: "✅",
            duration: 3000,
          });
        }
      }
    } catch (err) {
      console.error("Error updating password:", err);
      setError("Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <BackgroundWrapper className="flex flex-col justify-center items-center p-4">
        <CardVertical title="Mot de passe mis à jour">
          <div className="flex flex-col flex-grow">
            <div className="mb-6 mt-16 text-center">
              <span
                className="flex-shrink-0 mr-2"
                style={{ color: "var(--color-marron)" }}
              >
                <CheckIcon className="text-marron" />
              </span>
              <h3 className="text-xl font-aboreto text-marron mb-4">
                Succès !
              </h3>
              <p className="text-gray-600 font-chillax leading-relaxed">
                Votre mot de passe a été mis à jour avec succès.
              </p>
              <p className="text-gray-500 text-sm mt-4 font-chillax">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de
                passe.
              </p>
            </div>

            <div className="flex-grow flex flex-col justify-end">
              <Link
                href="/signin"
                className="w-full bg-encoregreen text-white py-4 px-6 rounded-full text-lg font-chillax hover:bg-encoregreen/80 transition-colors duration-200 text-center"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </CardVertical>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper className="flex flex-col justify-center items-center p-4">
      <CardVertical title="Nouveau mot de passe">
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="mb-6 mt-16">
            <PasswordInput
              id="password"
              label="NOUVEAU MOT DE PASSE"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              showPasswordLabel="Afficher le mot de passe"
              hidePasswordLabel="Masquer le mot de passe"
            />
          </div>

          <div className="mb-6">
            <PasswordInput
              id="confirmPassword"
              label="CONFIRMER LE MOT DE PASSE"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
              showPasswordLabel="Afficher le mot de passe"
              hidePasswordLabel="Masquer le mot de passe"
            />
          </div>

          <div className="mb-6">
            <p className="text-gray-600 text-sm font-chillax leading-relaxed">
              Votre mot de passe doit contenir au moins 6 caractères.
            </p>
          </div>

          <ErrorMessage error={error} />

          <div className="flex-grow flex flex-col justify-end">
            <SubmitButton
              loading={loading}
              text="Mettre à jour le mot de passe"
            />

            <div className="text-center text-gray-500 italic text-sm font-inter-extralight-italic mt-4">
              <Link
                href="/signin"
                className="underline hover:text-marron transition-colors duration-200"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </form>
      </CardVertical>
    </BackgroundWrapper>
  );
}
