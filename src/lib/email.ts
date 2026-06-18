import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "no-reply@catalogo.app";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export interface EmailSubscriber {
  email: string;
  name: string | null;
  discountCode: string | null;
  unsubscribeToken: string;
}

export interface CampaignData {
  type: "welcome" | "discount" | "new_products" | "price_drop" | "general";
  subject: string;
  title: string;
  message: string;
  discountCode?: string;
  discountPercent?: number;
  products?: {
    title: string;
    price: string | null;
    imageUrl: string | null;
  }[];
}

export interface TenantEmailInfo {
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string;
}

function formatPrice(p: string | null): string {
  if (!p) return "";
  const n = parseFloat(p);
  if (isNaN(n)) return p;
  return `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n)}`;
}

function buildEmailHtml(
  tenant: TenantEmailInfo,
  campaign: CampaignData,
  subscriber: Pick<EmailSubscriber, "name" | "unsubscribeToken">
): string {
  const catalogUrl = `https://${tenant.subdomain}.${ROOT_DOMAIN}`;
  const unsubscribeUrl = `${catalogUrl}/api/unsubscribe?token=${subscriber.unsubscribeToken}`;
  const greeting = subscriber.name ? `Hola ${subscriber.name} 👋` : "Hola 👋";
  const primary = tenant.primaryColor || "#111827";

  const logoBlock = tenant.logoUrl
    ? `<img src="${tenant.logoUrl}" alt="${tenant.name}" style="max-height:56px;max-width:180px;object-fit:contain;" />`
    : `<span style="color:#ffffff;font-size:22px;font-weight:800;">${tenant.name}</span>`;

  const discountBlock = campaign.discountCode && campaign.discountPercent
    ? `<div style="background:#f9fafb;border:2px dashed #d1d5db;border-radius:14px;padding:24px;text-align:center;margin:28px 0;">
        <p style="margin:0 0 6px;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Tu código exclusivo</p>
        <p style="margin:0 0 6px;color:#111827;font-size:32px;font-weight:900;letter-spacing:6px;font-family:monospace;">${campaign.discountCode}</p>
        <p style="margin:0;color:#6b7280;font-size:13px;"><strong>${campaign.discountPercent}% de descuento</strong> en tu próxima compra</p>
      </div>`
    : "";

  const productsBlock = campaign.products && campaign.products.length > 0
    ? `<p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#374151;margin:28px 0 14px;">
        ${campaign.type === "price_drop" ? "🏷️ Precios especiales" : campaign.type === "new_products" ? "✨ Novedades" : "🌟 Destacados"}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
        ${campaign.products.slice(0, 4).map((p) => `
          <td width="${100 / Math.min(campaign.products!.length, 2)}%" style="padding:4px;vertical-align:top;">
            <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}" width="250" style="width:100%;height:150px;object-fit:cover;display:block;" />` : `<div style="width:100%;height:150px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:32px;">📦</div>`}
              <div style="padding:12px;">
                <p style="margin:0 0 4px;font-weight:700;color:#111827;font-size:13px;">${p.title}</p>
                ${p.price ? `<p style="margin:0;color:#6b7280;font-size:13px;font-weight:600;">${formatPrice(p.price)}</p>` : ""}
              </div>
            </div>
          </td>`).join("")}
      </tr></table>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${campaign.subject}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f5;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
      <!-- Header -->
      <tr><td align="center" style="background:${primary};padding:28px 32px;">${logoBlock}</td></tr>
      <!-- Body -->
      <tr><td style="padding:40px 36px;">
        <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">${greeting}</p>
        <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;line-height:1.3;">${campaign.title}</h2>
        <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.7;">${campaign.message.replace(/\n/g, "<br>")}</p>
        ${discountBlock}
        ${productsBlock}
        <!-- CTA -->
        <div style="text-align:center;margin:36px 0 0;">
          <a href="${catalogUrl}" style="background:${primary};color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:800;font-size:15px;display:inline-block;letter-spacing:.3px;">
            Ver catálogo →
          </a>
        </div>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 6px;color:#9ca3af;font-size:12px;">Recibís este email porque te suscribiste a <strong>${tenant.name}</strong>.</p>
        <a href="${unsubscribeUrl}" style="color:#9ca3af;font-size:11px;text-decoration:underline;">Darme de baja</a>
      </td></tr>
    </table>
    <p style="color:#c4c4c4;font-size:11px;text-align:center;margin-top:16px;">Enviado con Catálogo Digital</p>
  </td></tr>
</table>
</body></html>`;
}

export async function sendWelcomeEmail(
  tenant: TenantEmailInfo,
  subscriber: EmailSubscriber,
  welcomePercent: number
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const campaign: CampaignData = {
    type: "welcome",
    subject: `¡Bienvenida/o a ${tenant.name}! 🎉`,
    title: `¡Gracias por suscribirte!`,
    message: `Tu código de bienvenida ya está listo. Usalo en tu próxima compra para obtener ${welcomePercent}% de descuento.`,
    discountCode: subscriber.discountCode ?? undefined,
    discountPercent: welcomePercent,
  };
  await resend.emails.send({
    from: `${tenant.name} <${FROM_EMAIL}>`,
    to: subscriber.email,
    subject: campaign.subject,
    html: buildEmailHtml(tenant, campaign, subscriber),
  });
}

export async function sendCampaignEmails(
  tenant: TenantEmailInfo,
  subscribers: EmailSubscriber[],
  campaign: CampaignData
): Promise<{ sent: number; failed: number }> {
  if (!process.env.RESEND_API_KEY) {
    return { sent: 0, failed: subscribers.length };
  }

  const active = subscribers; // Already filtered to active on the caller side
  let sent = 0;
  let failed = 0;

  // Resend batch: max 100 per call
  const BATCH = 50;
  for (let i = 0; i < active.length; i += BATCH) {
    const chunk = active.slice(i, i + BATCH);
    try {
      await resend.batch.send(
        chunk.map((sub) => ({
          from: `${tenant.name} <${FROM_EMAIL}>`,
          to: sub.email,
          subject: campaign.subject,
          html: buildEmailHtml(tenant, campaign, sub),
        }))
      );
      sent += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }
  return { sent, failed };
}
