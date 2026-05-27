import { auth } from "@/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { saveImageToGridFS } from "@/lib/images";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized.", 401);
  if (!rateLimit(`images:${session.user.id}`, 30, 60_000)) return fail("Too many uploads. Try again shortly.", 429);

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return fail("Upload an image file.", 422);

    const image = await saveImageToGridFS({ file, uploadedBy: session.user.id });
    return ok(image, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
