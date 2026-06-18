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
}

export function WhyChooseUs({ label, headline, description, items }: Props) {
  if (items.length === 0) return null;

  const cols = items.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8">

        {/* Layout 2 columnas en desktop */}
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
                <span className="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-110 origin-left">
                  {item.icon}
                </span>
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
