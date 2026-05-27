"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { INSURANCE_PARTNERS, ISSUE_TYPES, PRIORITIES } from "@/lib/constants";
import { ticketCreateSchema, type TicketCreateInput } from "@/lib/validations/ticket";
import { Button } from "@/components/ui/button";
import { LoadingOverlay, Spinner } from "@/components/ui/loader";

export function TicketForm() {
  const router = useRouter();
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const form = useForm<TicketCreateInput>({
    resolver: zodResolver(ticketCreateSchema),
    defaultValues: {
      issueType: "Policy Issue",
      insurancePartner: undefined,
      mobileNumber: "",
      issueDescription: "",
      raisedBy: "",
      priority: "Medium",
      imageId: "",
      assigneeEmail: "",
    } as unknown as TicketCreateInput,
  });

  const errors = form.formState.errors;
  const issueType = useWatch({ control: form.control, name: "issueType" });
  const imageId = useWatch({ control: form.control, name: "imageId" });
  const shownPreview = useMemo(() => preview || (imageId ? `/api/images/${imageId}?variant=thumb` : ""), [imageId, preview]);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/webp",
      });
      const body = new FormData();
      body.append("file", compressed);
      const response = await fetch("/api/images", { method: "POST", body });
      const json = await response.json();
      if (!response.ok) {
        form.setValue("imageId", "");
        toast.error(json.error?.message ?? "Upload failed.");
        return;
      }
      form.setValue("imageId", json.data.id, { shouldValidate: true });
      toast.success("Image uploaded.");
    } catch {
      form.setValue("imageId", "");
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: TicketCreateInput) {
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await response.json();
      if (!response.ok) {
        toast.error(json.error?.message ?? "Could not create ticket.");
        return;
      }
      toast.success("Ticket created.");
      startNavigation(() => {
        router.push(`/tickets/${json.data.id}`);
        router.refresh();
      });
    } catch {
      toast.error("Could not create ticket. Please try again.");
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))}
      className="relative grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {isNavigating && <LoadingOverlay label="Opening ticket" />}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Issue Type" error={errors.issueType?.message}>
          <select {...form.register("issueType")} className="input cursor-pointer">
            {ISSUE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </Field>
        <Field label="Priority" error={errors.priority?.message}>
          <select {...form.register("priority")} className="input cursor-pointer">
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </Field>
        {issueType === "Policy Issue" && (
          <>
        <Field label="Insurance Partner" error={errors.insurancePartner?.message}>
          <select {...form.register("insurancePartner")} className="input cursor-pointer">
            <option value="">Choose partner</option>
            {INSURANCE_PARTNERS.map((partner) => <option key={partner} value={partner}>{partner}</option>)}
          </select>
        </Field>
        <Field label="Mobile Number" error={errors.mobileNumber?.message}>
          <input {...form.register("mobileNumber")} inputMode="numeric" maxLength={10} className="input" placeholder="9876543210" />
        </Field>
          </>
        )}
        <Field label="Raised By" error={errors.raisedBy?.message}>
          <input {...form.register("raisedBy")} className="input" placeholder="Person name" />
        </Field>
        <Field label="Assignee Email" error={errors.assigneeEmail?.message}>
          <input {...form.register("assigneeEmail")} className="input" placeholder="teammate@company.com" />
        </Field>
      </div>
      <Field label="Issue Description" error={errors.issueDescription?.message}>
        <textarea {...form.register("issueDescription")} className="input min-h-36 resize-y py-3" placeholder="Explain the policy issue, context, and expected resolution." />
      </Field>
      <div>
        <label
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) uploadFile(file);
          }}
          className="relative grid min-h-40 cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-blue-400 dark:border-slate-700 dark:bg-slate-950"
        >
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0])} />
          {uploading && <LoadingOverlay label="Uploading image" />}
          {shownPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shownPreview} alt="Attachment preview" className="max-h-56 rounded-md object-contain" />
              <button type="button" onClick={(event) => { event.preventDefault(); setPreview(""); form.setValue("imageId", ""); }} className="absolute right-2 top-2 cursor-pointer rounded-full bg-white p-1 shadow dark:bg-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <ImagePlus className="mx-auto h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium">Drop an image or click to upload</p>
              <p className="text-xs text-slate-500">JPG, PNG, GIF, WebP up to 4 MB</p>
            </div>
          )}
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={isNavigating} onClick={() => router.push("/tickets")}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting || uploading || isNavigating}>
          {(form.formState.isSubmitting || uploading || isNavigating) && <Spinner />}
          {form.formState.isSubmitting ? "Creating" : uploading ? "Uploading" : isNavigating ? "Opening" : "Create Ticket"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
      {error && <span className="text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}
