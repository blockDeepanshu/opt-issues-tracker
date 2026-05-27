"use client";

import { format } from "date-fns";
import imageCompression from "browser-image-compression";
import { ImagePlus, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { MessageDTO } from "@/lib/serializers";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loader";

export function ChatPanel({ ticketId, initialMessages }: { ticketId: string; initialMessages: MessageDTO[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [imageId, setImageId] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const source = new EventSource("/api/realtime");
    source.addEventListener("message:created", (event) => {
      const next = JSON.parse((event as MessageEvent).data) as MessageDTO;
      if (next.ticketId === ticketId) {
        setMessages((current) => current.some((item) => item.id === next.id) ? current : [...current.filter((item) => !item.id.startsWith("optimistic-")), next]);
      }
    });
    source.onerror = () => source.close();
    return () => source.close();
  }, [ticketId]);

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setIsUploading(true);
    setImagePreview(URL.createObjectURL(file));
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
        fileType: "image/webp",
      });
      const body = new FormData();
      body.append("file", compressed);
      const response = await fetch("/api/images", { method: "POST", body });
      const json = await response.json();
      if (!response.ok) {
        toast.error(json.error?.message ?? "Upload failed.");
        setImageId("");
        setImagePreview("");
        return;
      }
      setImageId(json.data.id);
      setImagePreview(json.data.thumbnailUrl);
    } catch {
      setImageId("");
      setImagePreview("");
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function send() {
    const text = message.trim();
    if (!text && !imageId) return;

    const optimistic: MessageDTO = {
      id: `optimistic-${Date.now()}`,
      ticketId,
      senderId: "me",
      senderName: "You",
      message: text,
      messageType: imageId && text ? "mixed" : imageId ? "image" : "text",
      imageId,
      imageUrl: imageId ? `/api/images/${imageId}` : undefined,
      thumbnailUrl: imageId ? `/api/images/${imageId}?variant=thumb` : undefined,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setMessage("");
    setImageId("");
    setImagePreview("");
    setIsSending(true);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, imageId: optimistic.imageId }),
      });
      const json = await response.json();
      if (!response.ok) {
        setMessages((current) => current.filter((item) => item.id !== optimistic.id));
        toast.error(json.error?.message ?? "Message failed.");
      } else {
        setMessages((current) => current.map((item) => (item.id === optimistic.id ? json.data : item)));
      }
    } catch {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      toast.error("Message failed.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="grid min-h-[480px] grid-rows-[auto_1fr_auto] rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold">Ticket chat</h2>
      </header>
      <div className="space-y-3 overflow-y-auto p-4">
        {messages.length ? messages.map((item) => (
          <div key={item.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span className="font-medium text-slate-700 dark:text-slate-300">{item.senderName}</span>
              <time>{format(new Date(item.createdAt), "MMM d, h:mm a")}</time>
            </div>
            {item.thumbnailUrl && (
              <button type="button" className="mb-2 block cursor-zoom-in" onClick={() => setExpandedImage(item.imageUrl ?? item.thumbnailUrl ?? null)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" src={item.thumbnailUrl} alt="Chat attachment" className="max-h-48 rounded-md border border-slate-200 object-contain dark:border-slate-800" />
              </button>
            )}
            {item.message && <p className="whitespace-pre-wrap text-sm leading-6">{item.message}</p>}
          </div>
        )) : <div className="grid h-full place-items-center text-sm text-slate-500">No messages yet</div>}
        <div ref={bottomRef} />
      </div>
      <div
        className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-800"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) uploadImage(file);
        }}
      >
        {imagePreview && (
          <div className="relative inline-flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Pending chat upload" className="h-20 rounded-md border border-slate-200 object-contain dark:border-slate-800" />
            <button type="button" className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow dark:bg-slate-900" onClick={() => { setImageId(""); setImagePreview(""); }}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
        <label className="grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-slate-200 dark:border-slate-800">
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0])} />
          {isUploading ? <Spinner /> : <ImagePlus className="h-4 w-4" />}
        </label>
        <input
          value={message}
          disabled={isSending || isUploading}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") send(); }}
          className="input disabled:opacity-60"
          placeholder="Type a message"
        />
        <Button type="button" size="icon" disabled={isSending || isUploading} onClick={send} aria-label="Send message">
          {isSending ? <Spinner /> : <Send className="h-4 w-4" />}
        </Button>
        </div>
      </div>
      {expandedImage && (
        <button type="button" className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-black/70 p-6" onClick={() => setExpandedImage(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={expandedImage} alt="Expanded chat attachment" className="max-h-full max-w-full rounded-lg bg-white object-contain" />
        </button>
      )}
    </section>
  );
}
