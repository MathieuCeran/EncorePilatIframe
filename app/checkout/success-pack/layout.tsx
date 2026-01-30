import config from "@/config";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Merci pour votre réservation - ${config.appName}`,
};

export default async function LayoutPrivate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
