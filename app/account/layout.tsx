import { redirect } from "next/navigation";
import config from "@/config";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Account - ${config.appName}`,
};
export default async function LayoutPrivate({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.auth.loginUrl);
  }

  return <div>{children}</div>;
}
