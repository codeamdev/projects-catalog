import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SuperAdminLoginForm } from "@/components/superadmin/SuperAdminLoginForm";

export default async function SuperAdminLoginPage() {
  const session = await auth();
  if (session?.user.role === "SUPER_ADMIN") redirect("/superadmin");

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Acceso global</p>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
        </div>
        <SuperAdminLoginForm />
      </div>
    </div>
  );
}
