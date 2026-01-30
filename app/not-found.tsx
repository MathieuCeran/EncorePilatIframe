"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers page d'accueil après 2s
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000); // 2s

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Page non trouvée
        </h1>
        <p className="text-gray-600">
          Redirection vers la page d&apos;accueil...
        </p>
      </div>
    </div>
  );
}
