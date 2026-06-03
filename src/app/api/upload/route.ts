import { NextRequest, NextResponse } from "next/server";
import { mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import sharp from "sharp";

const IMAGE_MAX = 10 * 1024 * 1024;
const VIDEO_MAX = 200 * 1024 * 1024;

const ALLOWED_IMAGES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif",
]);
const ALLOWED_VIDEOS = new Set([
  "video/mp4", "video/webm", "video/ogg", "video/quicktime",
]);
const VIDEO_EXT: Record<string, string> = {
  "video/mp4": "mp4", "video/webm": "webm",
  "video/ogg": "ogv", "video/quicktime": "mov",
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Formato invalido" }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0)
    return NextResponse.json({ error: "No se recibio ningun archivo" }, { status: 400 });

  const isImage = ALLOWED_IMAGES.has(file.type);
  const isVideo = ALLOWED_VIDEOS.has(file.type);

  if (!isImage && !isVideo)
    return NextResponse.json(
      { error: "Tipo no permitido. Se aceptan imagenes (JPG, PNG, WebP, GIF, AVIF) y videos (MP4, WebM, OGG, MOV)." },
      { status: 400 }
    );

  const maxBytes = isVideo ? VIDEO_MAX : IMAGE_MAX;
  if (file.size > maxBytes) {
    const limit = isVideo ? "200 MB" : "10 MB";
    return NextResponse.json({ error: `El archivo supera el limite de ${limit}.` }, { status: 400 });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const subfolder = `uploads/${session.user.schemaName}`;
  const dir = join(process.cwd(), "public", subfolder);
  await mkdir(dir, { recursive: true });

  if (isVideo) {
    const ext = VIDEO_EXT[file.type] ?? "mp4";
    const name = `${id}.${ext}`;
    const { writeFile } = await import("fs/promises");
    await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/${subfolder}/${name}` });
  }

  // Imagen: convertir a WebP con Sharp, max 1920x1920
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${id}.webp`;
  await sharp(buffer)
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(join(dir, name));

  return NextResponse.json({ url: `/${subfolder}/${name}` });
}
