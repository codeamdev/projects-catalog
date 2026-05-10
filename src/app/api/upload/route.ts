import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";

const IMAGE_MAX = 10 * 1024 * 1024;  // 10 MB
const VIDEO_MAX = 200 * 1024 * 1024; // 200 MB

const ALLOWED_IMAGES = new Set([
  "image/jpeg", "image/png", "image/webp",
  "image/gif", "image/avif", "image/svg+xml",
]);
const ALLOWED_VIDEOS = new Set([
  "video/mp4", "video/webm", "video/ogg", "video/quicktime",
]);

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGES.has(file.type);
  const isVideo = ALLOWED_VIDEOS.has(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "Tipo no permitido. Se aceptan imágenes (JPG, PNG, WebP, GIF, AVIF) y videos (MP4, WebM)." },
      { status: 400 }
    );
  }

  const maxBytes = isVideo ? VIDEO_MAX : IMAGE_MAX;
  if (file.size > maxBytes) {
    const limit = isVideo ? "200 MB" : "10 MB";
    return NextResponse.json(
      { error: `El archivo supera el límite de ${limit}.` },
      { status: 400 }
    );
  }

  const ext = EXT_MAP[file.type] ?? "bin";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const subfolder = `uploads/${session.user.schemaName}`;
  const dir = join(process.cwd(), "public", subfolder);

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/${subfolder}/${name}` });
}
