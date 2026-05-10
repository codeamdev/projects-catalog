interface Props {
  videoUrl: string;
  title?: string | null;
  subtitle?: string | null;
  primaryColor?: string;
}

function getYouTubeId(url: string): string | null {
  const match =
    url.match(/youtu\.be\/([^?&]+)/) ||
    url.match(/[?&]v=([^?&]+)/);
  return match?.[1] ?? null;
}

export function VideoSection({ videoUrl, title, subtitle, primaryColor = "#111827" }: Props) {
  const ytId = getYouTubeId(videoUrl);
  const embedUrl = ytId
    ? `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`
    : null;

  return (
    <section className="py-16 px-4" style={{ backgroundColor: primaryColor }}>
      <div className="max-w-screen-xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && (
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">{title}</h2>
            )}
            {subtitle && (
              <p className="text-white/65 text-lg max-w-xl mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        <div
          className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black"
          style={{ aspectRatio: "16/9" }}
        >
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title ?? "Video promocional"}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={videoUrl}
              controls
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </section>
  );
}
