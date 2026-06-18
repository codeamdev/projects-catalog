import {
  Truck, ShieldCheck, Star, Heart, Gift, BadgeCheck, Lock, CreditCard, Tag,
  Package, RefreshCw, Clock, Phone, MapPin, Users, Zap, Leaf, Award,
  ThumbsUp, Eye, Gem, Headphones, CheckCircle, Sparkles, Store, Percent,
  type LucideIcon,
} from "lucide-react";

export const WHY_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  truck:         { label: "Envío",         Icon: Truck },
  shield:        { label: "Garantía",      Icon: ShieldCheck },
  star:          { label: "Calidad",       Icon: Star },
  heart:         { label: "Favorito",      Icon: Heart },
  gift:          { label: "Regalo",        Icon: Gift },
  badge:         { label: "Certificado",   Icon: BadgeCheck },
  lock:          { label: "Seguridad",     Icon: Lock },
  card:          { label: "Pago",          Icon: CreditCard },
  tag:           { label: "Precio",        Icon: Tag },
  package:       { label: "Producto",      Icon: Package },
  refresh:       { label: "Devolución",    Icon: RefreshCw },
  clock:         { label: "Rapidez",       Icon: Clock },
  phone:         { label: "Soporte",       Icon: Phone },
  pin:           { label: "Ubicación",     Icon: MapPin },
  users:         { label: "Comunidad",     Icon: Users },
  zap:           { label: "Velocidad",     Icon: Zap },
  leaf:          { label: "Orgánico",      Icon: Leaf },
  award:         { label: "Premio",        Icon: Award },
  thumbsup:      { label: "Satisfacción",  Icon: ThumbsUp },
  eye:           { label: "Transparencia", Icon: Eye },
  gem:           { label: "Premium",       Icon: Gem },
  headphones:    { label: "Atención",      Icon: Headphones },
  check:         { label: "Verificado",    Icon: CheckCircle },
  sparkles:      { label: "Exclusivo",     Icon: Sparkles },
  store:         { label: "Tienda",        Icon: Store },
  percent:       { label: "Descuento",     Icon: Percent },
};

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

function ItemIcon({ name, style }: { name: string; style: string }) {
  const entry = WHY_ICONS[name];

  if (!entry) {
    // emoji fallback
    return <span className="text-3xl leading-none">{name}</span>;
  }

  const { Icon } = entry;

  if (style === "circle") {
    return (
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--primary, #111827)" }}
      >
        <Icon size={26} strokeWidth={1.8} color="white" />
      </div>
    );
  }

  if (style === "bold") {
    return <Icon size={36} strokeWidth={2.5} style={{ color: "var(--primary, #111827)" }} />;
  }

  // outline (default)
  return <Icon size={36} strokeWidth={1.5} style={{ color: "var(--primary, #111827)" }} />;
}

export function WhyChooseUs({ label, headline, description, items, iconStyle = "outline" }: Props) {
  if (items.length === 0) return null;

  const cols = items.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2";

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
              <p className="text-gray-500 text-base leading-relaxed max-w-md">
                {description}
              </p>
            )}
          </div>

          {/* Columna derecha — cards */}
          <div className={`flex-1 grid ${cols} gap-px bg-gray-200 rounded-2xl overflow-hidden shadow-sm`}>
            {items.map((item, i) => (
              <div
                key={i}
                className="bg-white p-6 sm:p-8 flex flex-col gap-3 group hover:bg-gray-50 transition-colors duration-200"
              >
                <ItemIcon name={item.icon} style={iconStyle} />
                <p className="font-bold text-gray-900 text-base sm:text-[17px] leading-snug mt-1">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
