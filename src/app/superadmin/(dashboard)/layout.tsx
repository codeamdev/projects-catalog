import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SuperAdminSidebar } from "@/components/superadmin/SuperAdminSidebar";
import { SessionGuard } from "@/components/admin/SessionGuard";
import { Toaster } from "sonner";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/superadmin/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <main className="flex-1 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      <SessionGuard expires={session.expires} loginPath="/superadmin/login" />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
