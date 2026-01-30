import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Authentification - Encore Pilates`,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pas de redirection automatique ici car cette page gère les callbacks d'auth
  return <div>{children}</div>;
}
