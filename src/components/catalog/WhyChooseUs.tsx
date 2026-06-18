import {
  Truck, ShieldCheck, Star, Heart, Gift, BadgeCheck, Lock, CreditCard, Tag,
  Package, RefreshCw, Clock, Phone, MapPin, Users, Zap, Leaf, Award,
  ThumbsUp, Eye, Gem, Headphones, CheckCircle, Sparkles, Store, Percent,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Item {
  icon: string;
  title: string;
  description: string;
}

interface Props {
  label: string;
  headline: string;
  description?: string;
  items: Item[];
  iconStyle?: string;
}

// Mapa de íconos Lucide (backward-compat con datos previos + picker)
export const WHY_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  truck:       { label: "Envío",       Icon: Truck },
  shieldCheck: { label: "Garantía",    Icon: ShieldCheck },
  star:        { label: "Calidad",     Icon: Star },
  heart:       { label: "Con amor",    Icon: Heart },
  gift:        { label: "Regalo",      Icon: Gift },
  badgeCheck:  { label: "Verificado",  Icon: BadgeCheck },
  lock:        { label: "Seguro",      Icon: Lock },
  creditCard:  { label: "Pago",        Icon: CreditCard },
  tag:         { label: "Oferta",      Icon: Tag },
  package:     { label: "Paquete",     Icon: Package },
  refreshCw:   { label: "Devolución",  Icon: RefreshCw },
  clock:       { label: "Rápido",      Icon: Clock },
  phone:       { label: "Atención",    Icon: Phone },
  mapPin:      { label: "Ubicación",   Icon: MapPin },
  users:       { label: "Equipo",      Icon: Users },
  zap:         { label: "Instantáneo", Icon: Zap },
  leaf:        { label: "Natural",     Icon: Leaf },
  award:       { label: "Premio",      Icon: Award },
  thumbsUp:    { label: "Aprobado",    Icon: ThumbsUp },
  eye:         { label: "Transparente",Icon: Eye },
  gem:         { label: "Premium",     Icon: Gem },
  headphones:  { label: "Soporte",     Icon: Headphones },
  checkCircle: { label: "Confirmado",  Icon: CheckCircle },
  sparkles:    { label: "Especial",    Icon: Sparkles },
  store:       { label: "Tienda",      Icon: Store },
  percent:     { label: "Descuento",   Icon: Percent },
};

// Lista de emoji para el picker del admin
export const WHY_EMOJIS = [
  { emoji: "🚚", label: "Envío" },     { emoji: "📦", label: "Paquete" },
  { emoji: "⚡", label: "Rápido" },    { emoji: "🔄", label: "Devolución" },
  { emoji: "🛵", label: "Moto" },      { emoji: "✈️", label: "Vuelo" },
  { emoji: "⭐", label: "Calidad" },   { emoji: "🌟", label: "Destacado" },
  { emoji: "💎", label: "Premium" },   { emoji: "👑", label: "Exclusivo" },
  { emoji: "🏆", label: "El mejor" },  { emoji: "🥇", label: "Primero" },
  { emoji: "🛡️", label: "Garantía" },  { emoji: "🔒", label: "Seguro" },
  { emoji: "✅", label: "Verificado" },{ emoji: "🤝", label: "Confianza" },
  { emoji: "🔐", label: "Protegido" }, { emoji: "📜", label: "Certificado" },
  { emoji: "💳", label: "Pago" },      { emoji: "💰", label: "Precio" },
  { emoji: "🏷️", label: "Oferta" },    { emoji: "💵", label: "Efectivo" },
  { emoji: "🎟️", label: "Cupón" },     { emoji: "📞", label: "Teléfono" },
  { emoji: "💬", label: "Chat" },      { emoji: "👥", label: "Equipo" },
  { emoji: "🙋", label: "Ayuda" },     { emoji: "❤️", label: "Con amor" },
  { emoji: "🤗", label: "Amigable" },  { emoji: "✨", label: "Especial" },
  { emoji: "🎁", label: "Regalo" },    { emoji: "🌸", label: "Flor" },
  { emoji: "🌿", label: "Natural" },   { emoji: "🌺", label: "Fragancia" },
  { emoji: "💆", label: "Bienestar" }, { emoji: "💫", label: "Único" },
  { emoji: "🪄", label: "Mágico" },    { emoji: "🎯", label: "Exacto" },
  { emoji: "💯", label: "100%" },      { emoji: "🌈", label: "Variedad" },
  { emoji: "🏪", label: "Tienda" },    { emoji: "🔮", label: "Misterio" },
  { emoji: "🪴", label: "Orgánico" },  { emoji: "🌙", label: "Noche" },
  { emoji: "☀️", label: "Día" },       { emoji: "🎀", label: "Lazo" },
  { emoji: "🍃", label: "Eco" },       { emoji: "💝", label: "Cariño" },
  { emoji: "🌊", label: "Frescura" },  { emoji: "🔔", label: "Novedades" },
];

// Detecta si es un ícono Lucide (nombre) o emoji/texto
function isLucideName(icon: string): icon is keyof typeof WHY_ICONS {
  return icon in WHY_ICONS;
}

// Estilos: "plain" | "circle-soft" | "circle-color" (para emoji)
//          "color" | "dark" | "circle-color" | "circle-dark" (para Lucide)
function ItemIcon({ icon, style }: { icon: string; style: string }) {
  if (isLucideName(icon)) {
    const { Icon } = WHY_ICONS[icon];
    if (style === "circle-color" || style === "circle-soft") {
      return (
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--primary, #111827)" }}>
          <Icon size={26} strokeWidth={1.8} color="white" />
        </div>
      );
    }
    if (style === "dark" || style === "circle-dark") {
      return (
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gray-900">
          <Icon size={26} strokeWidth={1.8} color="white" />
        </div>
      );
    }
    // "color" / "plain"
    return <Icon size={38} strokeWidth={1.8} style={{ color: "var(--primary, #111827)" }} />;
  }

  // Emoji rendering
  if (style === "circle-color") {
    return (
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--primary, #111827)" }}>
        <span className="text-3xl leading-none">{icon}</span>
      </div>
    );
  }
  if (style === "circle-soft" || style === "circle-dark") {
    return (
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "color-mix(in srgb, var(--primary, #6366f1) 14%, white)" }}>
        <span className="text-3xl leading-none">{icon}</span>
      </div>
    );
  }
  // plain
  return <span className="text-4xl sm:text-5xl leading-none">{icon}</span>;
}

export function WhyChooseUs({ label, headline, description, items, iconStyle = "plain" }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 lg:items-center">

          {/* Columna izquierda — texto */}
          <div className="lg:w-[38%] lg:flex-shrink-0">
            <p className="text-[10px] tracking-[0.35em] uppercase text-gray-400 font-semibold mb-5 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-gray-300" />
              {label}
              <span className="inline-block h-px w-8 bg-gray-300" />
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-gray-900 leading-tight tracking-tight mb-5">
              {headline}
            </h2>
            {description && (
              <p className="text-gray-500 text-base leading-relaxed max-w-md">{description}</p>
            )}
          </div>

          {/* Columna derecha — cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {items.map((item, i) => (
              <div key={i} className="bg-white p-6 sm:p-8 flex flex-col gap-3 hover:bg-gray-50 transition-colors duration-200">
                <ItemIcon icon={item.icon} style={iconStyle} />
                <p className="font-bold text-gray-900 text-base sm:text-[17px] leading-snug mt-1">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
