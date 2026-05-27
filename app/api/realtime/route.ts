import { auth } from "@/auth";
import { addRealtimeClient } from "@/lib/realtime/broker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: { message: "Unauthorized." } }, { status: 401 });
  }

  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      cleanup = addRealtimeClient(controller);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
