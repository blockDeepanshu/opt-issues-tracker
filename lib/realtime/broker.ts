type RealtimeEvent =
  | { type: "ticket:created"; payload: unknown }
  | { type: "ticket:updated"; payload: unknown }
  | { type: "ticket:deleted"; payload: unknown }
  | { type: "message:created"; payload: unknown };

const globalForRealtime = globalThis as typeof globalThis & {
  realtimeClients?: Set<ReadableStreamDefaultController<Uint8Array>>;
};

const clients = globalForRealtime.realtimeClients ?? new Set<ReadableStreamDefaultController<Uint8Array>>();
globalForRealtime.realtimeClients = clients;

const encoder = new TextEncoder();

export function addRealtimeClient(controller: ReadableStreamDefaultController<Uint8Array>) {
  clients.add(controller);
  controller.enqueue(encoder.encode(`event: ready\ndata: {}\n\n`));

  return () => {
    clients.delete(controller);
  };
}

export function publishRealtime(event: RealtimeEvent) {
  const chunk = encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`);

  for (const controller of clients) {
    try {
      controller.enqueue(chunk);
    } catch {
      clients.delete(controller);
    }
  }
}
