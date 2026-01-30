import { redirect } from "next/navigation";
import config from "@/config";
import { createClient } from "@/lib/supabase/server";
import AdminBodyReset from "@/components/admin/AdminBodyReset";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Admin - ${config.appName}`,
};

export default async function LayoutPrivate({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check if user is admin or hostess using the is_admin and is_hostess RPCs
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  const { data: isHostess, error: hostessError } =
    await supabase.rpc("is_hostess");

  if (adminError || !isAdmin) {
    if (hostessError || !isHostess) {
      redirect(config.auth.loginUrl);
    }
  }

  return (
    <div>
      <AdminBodyReset />
      {children}
    </div>
  );
}
