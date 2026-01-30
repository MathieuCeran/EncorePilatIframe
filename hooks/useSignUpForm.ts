import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export function useSignUpForm(router: ReturnType<typeof useRouter>) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "212",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const isStep1Complete = formData.firstName.trim() && formData.lastName.trim();
  const isStep2Complete = formData.email.trim() && formData.phone.trim();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1 && !isStep1Complete) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (step === 2 && !isStep2Complete) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Étape 1: Créer le compte utilisateur sans email automatique
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              last_name: formData.lastName,
              first_name: formData.firstName,
              phone: `+${formData.countryCode}${formData.phone}`,
            },
          },
        });

      if (signUpError) {
        // Gestion des erreurs spécifiques
        if (signUpError.message.includes("already registered")) {
          setError("Cette adresse email est déjà utilisée.");
        } else if (signUpError.message.includes("Password should")) {
          setError("Le mot de passe doit contenir au moins 6 caractères.");
        } else {
          setError(signUpError.message || "L'inscription a échoué.");
        }
        return;
      }

      // Étape 2: Envoyer l'email de confirmation via notre service Resend
      if (signUpData.user && !signUpData.user.email_confirmed_at) {
        try {
          const response = await fetch("/api/auth/send-confirmation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
            }),
          });

          const result = await response.json();

          if (!result.success) {
            console.error(
              "Erreur lors de l'envoi de l'email de confirmation:",
              result.error
            );
            // On continue quand même car le compte est créé
            toast.success("Compte créé avec succès !", {
              description:
                "Veuillez vérifier votre email pour confirmer votre compte.",
              icon: "🎉",
              duration: 5000,
            });
          } else {
            toast.success("Compte créé avec succès !", {
              description:
                "Un email de confirmation vous a été envoyé. Vérifiez votre boîte de réception.",
              icon: "📧",
              duration: 5000,
            });
          }
        } catch (emailError) {
          console.error("Erreur lors de l'envoi de l'email:", emailError);
          // On continue quand même car le compte est créé
          toast.success("Compte créé avec succès !", {
            description:
              "Veuillez vérifier votre email pour confirmer votre compte.",
            icon: "🎉",
            duration: 5000,
          });
        }
      } else {
        // Cas où l'email est déjà confirmé (rare)
        toast.success("Compte créé avec succès !", {
          description: "Vous pouvez maintenant vous connecter.",
          icon: "🎉",
          duration: 3000,
        });
      }

      // Redirection vers la page de connexion
      router.push("/signin");
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    step,
    loading,
    error,
    handleInputChange,
    handleNext,
    handleBack,
    handleSubmit,
  };
}
