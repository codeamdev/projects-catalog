import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar tenantName={session.user.tenantName} />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
