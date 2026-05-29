import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { SessionGuard } from "@/components/admin/SessionGuard";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <>
      <AdminShell tenantName={session.user.tenantName}>
        {children}
      </AdminShell>
      <SessionGuard expires={session.expires} loginPath="/admin/login" />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
