interface Item {
  icon: string;
  title: string;
  description: string;
}

interface Props {
  title: string;
  items: Item[];
}

export function WhyChooseUs({ title, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-zinc-950">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14 sm:mb-16">
          <p className="text-[10px] tracking-[0.35em] uppercase text-amber-400 font-semibold mb-4">
            Nuestra promesa
          </p>
          <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide">
            {title}
          </h2>
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-amber-400/40" />
            <div className="w-1 h-1 rounded-full bg-amber-400" />
            <div className="h-px w-12 bg-amber-400/40" />
          </div>
        </div>

        {/* Grid de items */}
        <div className={`grid divide-y sm:divide-y-0 sm:divide-x divide-white/10 ${
          items.length === 1 ? "grid-cols-1 max-w-xs mx-auto" :
          items.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
          items.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}>
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center px-8 py-8 sm:py-6 gap-4 group">
              <span className="text-3xl sm:text-4xl transition-transform duration-500 group-hover:scale-110">
                {item.icon}
              </span>
              <div className="w-6 h-px bg-amber-400/60 transition-all duration-500 group-hover:w-12 group-hover:bg-amber-400" />
              <p className="text-sm font-semibold tracking-wide text-white/90 uppercase">
                {item.title}
              </p>
              {item.description && (
                <p className="text-xs text-zinc-400 leading-relaxed max-w-[200px]">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
