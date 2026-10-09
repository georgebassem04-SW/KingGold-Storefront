/**
 * "DESIGN YOUR PIECE" FORM (runs in the browser) — page /pages/customize (block "custom_order")
 * ------------------------------------------------------------------
 * The customer adds 1–4 photos of the piece, chooses the type / karat, writes what they want, and leaves
 * their contact details. It is sent to /api/custom-requests → dashboard → "Customization requests".
 *
 * Photos: big phone photos are made smaller HERE before sending (longest side PHOTO_MAX_SIDE px, JPEG),
 * so sending is fast even on mobile data. The server checks every photo again.
 *
 * Used by the page block "custom_order" (components/sections/CustomOrderSection.tsx) — the page itself is built
 * in the dashboard → Site pages (title, steps, success message, show karat / budget).
 *
 * Where to edit:
 *   - Field labels / errors (AR/EN)  -> i18n/dictionaries/*.json → "customOrder"
 *   - Piece types, karats, limits    -> lib/validation/custom-request.ts
 *   - Photo size after shrinking     -> PHOTO_MAX_SIDE / PHOTO_QUALITY below
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import type { Locale } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { customRequestSchema, KARATS, MAX_PHOTO_MB, MAX_PHOTOS, MIN_PHOTOS, PIECE_TYPES, type CustomRequestFormInput } from "@/lib/validation/custom-request";
import { fill } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PHOTO_MAX_SIDE = 1600;
const PHOTO_QUALITY = 0.85;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  locale: Locale;
  labels: Dictionary["customOrder"];
  /** Logged-in customer → name, phone and email are filled in */
  customer: { name: string; phone?: string; email?: string } | null;
  /** From the dashboard block (Site pages → "Design your piece" form). Empty = the dictionary text */
  successMessage?: string;
  showKarat?: boolean;
  showBudget?: boolean;
}

type Photo = { id: string; file: File; preview: string };
type Status = { kind: "idle" } | { kind: "sent"; reference?: string } | { kind: "error" };

/** Makes a big photo smaller (and turns other formats the browser can open into JPEG). Keeps small photos as they are. */
async function shrink(file: File): Promise<File> {
  if (file.size <= 1.5 * 1024 * 1024 && ACCEPTED.includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", PHOTO_QUALITY));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // the browser can't open it (e.g. HEIC on some browsers) → the server will say it isn't supported
  }
}

export function CustomOrderForm({ locale, labels: L, customer, successMessage, showKarat = true, showBudget = true }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState<string>();
  const [preparing, setPreparing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomRequestFormInput>({
    resolver: zodResolver(customRequestSchema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      preferredChannel: "whatsapp",
      pieceType: "" as CustomRequestFormInput["pieceType"],
      karat: "any",
      budget: "",
      description: "",
      website: "",
    },
  });

  // Free the photo previews when leaving the page
  const latest = useRef<Photo[]>([]);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const errorText = (code?: string) =>
    code ? fill(L.errors[code as keyof typeof L.errors] ?? L.errors.required, { max: MAX_PHOTOS, mb: MAX_PHOTO_MB }) : undefined;

  async function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    setPhotoError(undefined);
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(list).slice(0, Math.max(room, 0));
    if (list.length > room) setPhotoError("tooManyPhotos");
    setPreparing(true);
    const ready: Photo[] = [];
    for (const original of picked) {
      const file = await shrink(original);
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        setPhotoError("photoTooBig");
        continue;
      }
      ready.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
    }
    setPreparing(false);
    setPhotos((now) => [...now, ...ready].slice(0, MAX_PHOTOS));
    if (fileInput.current) fileInput.current.value = ""; // so the same photo can be picked again after removing it
  }

  function removePhoto(id: string) {
    setPhotos((now) => {
      const gone = now.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.preview);
      return now.filter((p) => p.id !== id);
    });
  }

  async function onSubmit(values: CustomRequestFormInput) {
    setStatus({ kind: "idle" });
    if (photos.length < MIN_PHOTOS) {
      setPhotoError("photoRequired");
      return;
    }
    const form = new FormData();
    for (const [k, v] of Object.entries(values)) form.append(k, String(v ?? ""));
    form.append("locale", locale);
    for (const p of photos) form.append("photos", p.file, p.file.name);
    try {
      const res = await fetch("/api/custom-requests", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.ok) {
        photos.forEach((p) => URL.revokeObjectURL(p.preview));
        setPhotos([]);
        reset();
        setStatus({ kind: "sent", reference: data.reference });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (data.errors) {
        for (const [field, code] of Object.entries(data.errors as Record<string, string>)) {
          if (field === "photos") setPhotoError(code);
          else setError(field as keyof CustomRequestFormInput, { message: code });
        }
        return;
      }
      setStatus({ kind: "error" });
    } catch {
      setStatus({ kind: "error" });
    }
  }

  // ===== SUCCESS =====
  if (status.kind === "sent") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-secondary/40 p-10 text-center" role="status">
        <CheckCircle2 className="mb-4 size-12 text-primary" />
        {/* The dashboard's message (Site pages → this block) replaces the default title + text */}
        {successMessage ? (
          <p className="max-w-md text-lg font-semibold">{successMessage}</p>
        ) : (
          <>
            <p className="text-xl font-semibold">{L.successTitle}</p>
            <p className="mt-2 max-w-md text-muted-foreground">{L.successText}</p>
          </>
        )}
        {status.reference && (
          <p className="mt-3 text-sm">
            {L.referenceLabel}: <b dir="ltr">{status.reference}</b>
          </p>
        )}
        <Button variant="outline" className="mt-6" onClick={() => setStatus({ kind: "idle" })}>
          {L.sendAnother}
        </Button>
      </div>
    );
  }

  const channel = watch("preferredChannel");

  // ===== FORM =====
  return (
    <form onSubmit={handleSubmit(onSubmit, () => photos.length < MIN_PHOTOS && setPhotoError("photoRequired"))} noValidate className="space-y-6 rounded-xl border p-6 md:p-8">
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...register("website")} />

      {/* ----- Photos ----- */}
      <fieldset aria-describedby="photos-hint">
        <legend className="mb-1 text-sm font-medium">{L.photos}</legend>
        <p id="photos-hint" className="mb-3 text-xs text-muted-foreground">
          {fill(L.photosHint, { max: MAX_PHOTOS })}
        </p>
        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={p.id} className="relative size-28 overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the customer's own photo */}
              <img src={p.preview} alt={`${L.photos} ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                aria-label={`${L.removePhoto} ${i + 1}`}
                className="absolute top-1 end-1 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label
              className={cn(
                "flex size-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-xs text-muted-foreground hover:border-primary hover:text-primary",
                photoError && "border-destructive text-destructive",
              )}
            >
              {preparing ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
              {preparing ? L.preparing : L.addPhoto}
              <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" disabled={preparing} onChange={(e) => void addPhotos(e.target.files)} />
            </label>
          )}
        </div>
        {photoError && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {errorText(photoError)}
          </p>
        )}
      </fieldset>

      {/* ----- The piece ----- */}
      <div className={cn("grid gap-5", [showKarat, showBudget].filter(Boolean).length === 2 ? "md:grid-cols-3" : showKarat || showBudget ? "md:grid-cols-2" : "md:max-w-sm")}>
        <Field id="pieceType" label={L.pieceType} error={errorText(errors.pieceType?.message)}>
          <NativeSelect id="pieceType" aria-invalid={!!errors.pieceType} {...register("pieceType")}>
            <option value="">{L.choosePiece}</option>
            {PIECE_TYPES.map((v) => (
              <option key={v} value={v}>
                {L.types[v]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {showKarat && (
          <Field id="karat" label={L.karat}>
            <NativeSelect id="karat" {...register("karat")}>
              {KARATS.map((v) => (
                <option key={v} value={v}>
                  {L.karats[v]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}
        {showBudget && (
          <Field id="budget" label={L.budget} error={errorText(errors.budget?.message)}>
            <Input id="budget" placeholder={L.budgetPlaceholder} {...register("budget")} />
          </Field>
        )}
      </div>

      <Field id="description" label={L.description} error={errorText(errors.description?.message)}>
        <Textarea id="description" rows={5} placeholder={L.descriptionPlaceholder} aria-invalid={!!errors.description} {...register("description")} />
      </Field>

      {/* ----- Contact ----- */}
      <div className="grid gap-5 md:grid-cols-3">
        <Field id="name" label={L.name} error={errorText(errors.name?.message)}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field id="phone" label={L.phone} error={errorText(errors.phone?.message)}>
          <Input id="phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
        <Field id="email" label={L.email} error={errorText(errors.email?.message)}>
          <Input id="email" type="email" dir="ltr" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{L.preferredChannel}</legend>
        <div className="flex flex-wrap gap-2">
          {(["whatsapp", "phone", "email"] as const).map((c) => (
            <label
              key={c}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors",
                channel === c ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary",
              )}
            >
              <input type="radio" value={c} className="sr-only" {...register("preferredChannel")} />
              {L.channels[c]}
            </label>
          ))}
        </div>
      </fieldset>

      {status.kind === "error" && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {L.errorGeneric}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting || preparing} className="w-full md:w-auto">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? L.sending : L.send}
      </Button>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
