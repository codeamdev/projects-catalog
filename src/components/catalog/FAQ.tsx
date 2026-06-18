interface FaqItem {
  question: string;
  answer: string;
}

interface Props {
  title: string;
  items: FaqItem[];
}

export function FAQ({ title, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-24 border-t border-gray-100">
      <div className="max-w-screen-md mx-auto px-4 sm:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
          {title}
        </h2>
        <div className="space-y-2">
          {items.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-gray-200 bg-gray-50 open:bg-white open:shadow-sm transition-all"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer px-6 py-4 list-none select-none">
                <span className="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
                  {item.question}
                </span>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 group-open:bg-gray-900 flex items-center justify-center transition-colors">
                  <svg
                    className="w-3 h-3 text-gray-600 group-open:text-white transition-transform duration-200 group-open:rotate-45"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
