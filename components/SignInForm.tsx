"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PasswordInput } from "./PasswordInput";
import { SubmitButton } from "./SubmitButton";
import { ErrorMessage } from "./ErrorMessage";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      // Fonction pour renvoyer le mail de confirmation
      if (error) {
        // Vérifier si l'erreur est liée à un email non vérifié
        if (error.message?.includes("Email not confirmed")) {
          setError(
            "Veuillez vérifier votre email avant de pouvoir vous connecter"
          );

          // Utiliser notre nouveau service d'email au lieu de Supabase
          try {
            const response = await fetch("/api/auth/send-confirmation", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: email.trim(),
              }),
            });

            if (response.ok) {
              toast.info("Un nouvel email de confirmation vous a été envoyé", {
                icon: "📧",
                duration: 4000,
              });
            }
          } catch (emailError) {
            console.error("Erreur lors du renvoi de l'email:", emailError);
          }
        } else {
          setError("Email ou mot de passe incorrect");
        }
        if (error.message?.includes("Invalid login credentials")) {
          setError("Email ou mot de passe incorrect");
        }
      } else {
        router.push("/account");
        toast.success("Vous êtes connecté.", {
          icon: "👋",
          duration: 1500,
        });
      }
    } catch (err) {
      console.error("Error signing in:", err);
      setError("Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="mb-4">
        <PasswordInput
          id="password"
          label="VOTRE MOT DE PASSE"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          showPasswordLabel="Afficher le mot de passe"
          hidePasswordLabel="Masquer le mot de passe"
        />
        <div className="mt-2 text-right">
          <Link
            href="/reset-password"
            className="text-sm text-marron underline transition-colors duration-200 font-chillax"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>

      <ErrorMessage error={error} />

      <div className="flex-grow flex flex-col justify-end">
        <SubmitButton loading={loading} />

        <div className="text-center text-gray-500 italic text-sm font-inter-extralight-italic">
          Vous n&apos;avez pas de compte ? &nbsp;
          <Link
            href="/signup"
            className="underline hover:text-marron transition-colors duration-200"
          >
            Créer un compte !
          </Link>
        </div>
      </div>
    </form>
  );
}
