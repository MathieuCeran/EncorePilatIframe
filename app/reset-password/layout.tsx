import config from "@/config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Reset Password - ${config.appName}`,
};

export default async function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Permettre l'accès aux pages de reset password même si l'utilisateur est connecté
  // car c'est nécessaire pour le processus de réinitialisation

  return <div>{children}</div>;
}
