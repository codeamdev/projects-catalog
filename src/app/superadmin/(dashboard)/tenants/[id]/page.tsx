import { notFound } from "next/navigation";
import { getTenantById, updateTenant } from "@/app/api/superadmin/actions";
import { TenantEditForm } from "./TenantEditForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTenantPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id);
  if (!tenant) notFound();

  async function updateAction(formData: FormData): Promise<void> {
    "use server";
    await updateTenant(id, formData);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar tenant</h1>
        <p className="text-sm text-gray-500 mt-1">
          <span className="font-mono">{tenant.subdomain}</span> — {tenant.name}
        </p>
      </div>

      <TenantEditForm tenant={tenant} updateAction={updateAction} />
    </div>
  );
}
