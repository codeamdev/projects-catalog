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

// Estilos: "plain" | "circle-soft" | "circle-color"
function ItemIcon({ icon, style }: { icon: string; style: string }) {
  if (style === "circle-color") {
    return (
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--primary, #111827)" }}>
        <span className="text-3xl leading-none">{icon}</span>
      </div>
    );
  }
  if (style === "circle-soft") {
    return (
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "color-mix(in srgb, var(--primary, #6366f1) 12%, white)" }}>
        <span className="text-3xl leading-none">{icon}</span>
      </div>
    );
  }
  // plain
  return <span className="text-4xl sm:text-5xl leading-none">{icon}</span>;
}

export function WhyChooseUs({ label, headline, description, items, iconStyle = "plain" }: Props) {
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
              <p className="text-gray-500 text-base leading-relaxed max-w-md">{description}</p>
            )}
          </div>

          {/* Columna derecha — cards */}
          <div className={`flex-1 grid ${cols} gap-px bg-gray-200 rounded-2xl overflow-hidden shadow-sm`}>
            {items.map((item, i) => (
              <div key={i} className="bg-white p-6 sm:p-8 flex flex-col gap-3 group hover:bg-gray-50 transition-colors duration-200">
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

// Lista de emoji disponibles para el picker del admin
export const WHY_EMOJIS = [
  // Entrega / Logística
  { emoji: "🚚", label: "Envío" },
  { emoji: "📦", label: "Paquete" },
  { emoji: "⚡", label: "Rápido" },
  { emoji: "🔄", label: "Devolución" },
  { emoji: "🛵", label: "Moto" },
  { emoji: "✈️", label: "Vuelo" },
  // Calidad / Premium
  { emoji: "⭐", label: "Calidad" },
  { emoji: "🌟", label: "Destacado" },
  { emoji: "💎", label: "Premium" },
  { emoji: "👑", label: "Exclusivo" },
  { emoji: "🏆", label: "El mejor" },
  { emoji: "🥇", label: "Primero" },
  // Seguridad / Confianza
  { emoji: "🛡️", label: "Garantía" },
  { emoji: "🔒", label: "Seguro" },
  { emoji: "✅", label: "Verificado" },
  { emoji: "🤝", label: "Confianza" },
  { emoji: "🔐", label: "Protegido" },
  { emoji: "📜", label: "Certificado" },
  // Pago / Precio
  { emoji: "💳", label: "Pago" },
  { emoji: "💰", label: "Precio" },
  { emoji: "🏷️", label: "Oferta" },
  { emoji: "💵", label: "Efectivo" },
  { emoji: "🎟️", label: "Cupón" },
  // Servicio / Atención
  { emoji: "📞", label: "Teléfono" },
  { emoji: "💬", label: "Chat" },
  { emoji: "👥", label: "Equipo" },
  { emoji: "🙋", label: "Ayuda" },
  { emoji: "❤️", label: "Con amor" },
  { emoji: "🤗", label: "Amigable" },
  // Producto / Experiencia
  { emoji: "✨", label: "Especial" },
  { emoji: "🎁", label: "Regalo" },
  { emoji: "🌸", label: "Flor" },
  { emoji: "🌿", label: "Natural" },
  { emoji: "🌺", label: "Fragancia" },
  { emoji: "💆", label: "Bienestar" },
  { emoji: "💫", label: "Único" },
  { emoji: "🪄", label: "Mágico" },
  { emoji: "🎯", label: "Exacto" },
  { emoji: "💯", label: "100%" },
  { emoji: "🌈", label: "Variedad" },
  { emoji: "🏪", label: "Tienda" },
  { emoji: "🔮", label: "Exclusivo" },
  { emoji: "🪴", label: "Orgánico" },
  { emoji: "🌙", label: "Noche" },
  { emoji: "☀️", label: "Día" },
  { emoji: "🎀", label: "Lazo" },
  { emoji: "🍃", label: "Eco" },
  { emoji: "💝", label: "Cariño" },
  { emoji: "🌊", label: "Frescura" },
];
