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
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
          {title}
        </h2>
        <div className={`grid gap-6 ${
          items.length === 1 ? "grid-cols-1 max-w-xs mx-auto" :
          items.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" :
          items.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
          "grid-cols-2 sm:grid-cols-4"
        }`}>
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 flex flex-col items-center text-center gap-3 shadow-sm border border-gray-100"
            >
              <span className="text-4xl">{item.icon}</span>
              <p className="font-bold text-gray-900 text-base leading-snug">{item.title}</p>
              {item.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
