"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/loader";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();

        // Récupérer les paramètres depuis l'URL (query params et fragment)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );

        // Vérifier d'abord les query params (nos tokens personnalisés)
        const customToken = urlParams.get("token");
        const customType = urlParams.get("type");

        // Puis les hash params (tokens Supabase)
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const supabaseType = hashParams.get("type");
        const error = hashParams.get("error");
        const errorCode = hashParams.get("error_code");
        const errorDescription = hashParams.get("error_description");

        // Gérer les erreurs Supabase
        if (error) {
          console.error(
            "Erreur dans le callback:",
            error,
            errorCode,
            errorDescription
          );

          switch (errorCode) {
            case "otp_expired":
              toast.error("Le lien de réinitialisation a expiré", {
                description: "Veuillez demander un nouveau lien ci-dessous",
                duration: 6000,
              });
              break;
            case "access_denied":
              toast.error("Lien invalide ou déjà utilisé", {
                description: "Demandez un nouveau lien de réinitialisation",
                duration: 6000,
              });
              break;
            default:
              toast.error("Erreur de validation", {
                description: errorDescription || "Le lien n'est plus valide",
                duration: 6000,
              });
          }

          router.push("/reset-password");
          return;
        }

        // Gérer notre token personnalisé de reset password
        if (customType === "password_reset" && customToken) {
          try {
            // Vérifier et valider le token via notre API
            const response = await fetch("/api/auth/verify-reset-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: customToken }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
              toast.error("Token de réinitialisation invalide ou expiré", {
                description: "Demandez un nouveau lien de réinitialisation",
              });
              router.push("/reset-password");
              return;
            }

            // Stocker le token validé dans sessionStorage pour la page de confirmation
            sessionStorage.setItem("reset_token", customToken);
            sessionStorage.setItem("reset_email", result.email);

            // Rediriger vers la page de confirmation
            router.push("/reset-password/confirm");
            return;
          } catch (fetchError) {
            console.error("Erreur lors de la validation du token:", fetchError);
            toast.error("Erreur lors de la validation du token");
            router.push("/reset-password");
            return;
          }
        }

        // Si c'est un reset password Supabase (fallback)
        if (supabaseType === "recovery" && accessToken && refreshToken) {
          // Définir la session avec les tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Erreur lors de la définition de la session:", error);
            toast.error("Lien de réinitialisation invalide ou expiré");
            router.push("/reset-password");
            return;
          }

          // Rediriger vers la page de confirmation de reset password
          router.push("/reset-password/confirm");
          return;
        }

        // Si c'est une confirmation d'email
        if (supabaseType === "signup" && accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Erreur lors de la confirmation:", error);
            toast.error("Lien de confirmation invalide ou expiré");
            router.push("/reset-password");
            return;
          }

          toast.success("Compte confirmé avec succès !");
          router.push("/account");
          return;
        }

        // Si aucun type reconnu, rediriger vers reset-password
        router.push("/reset-password");
      } catch (error) {
        console.error("Erreur dans le callback auth:", error);
        toast.error("Une erreur est survenue");
        router.push("/reset-password");
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return null;
}
