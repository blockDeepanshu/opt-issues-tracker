import { getImageAssetStream } from "@/lib/images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const variant = searchParams.get("variant") === "thumb" ? "thumb" : "full";
  const image = await getImageAssetStream(id, variant);

  if (!image) {
    return Response.json({ error: { message: "Image not found." } }, { status: 404 });
  }

  return new Response(new Uint8Array(image.buffer), {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
