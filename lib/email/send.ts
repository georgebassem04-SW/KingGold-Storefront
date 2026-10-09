/**
 * EMAIL SENDER — one function, three ways to deliver.
 * ------------------------------------------------------------------
 * Choose with EMAIL_PROVIDER in .env.local:
 *
 *   console (default) -> nothing is sent. The email is saved as an HTML file in the folder
 *                        ".email-previews/" so you can open it in the browser while developing.
 *   smtp              -> sends through any mail server (company mail, Gmail, Outlook, Zoho...)
 *                        needs SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
 *   resend            -> sends through resend.com (simple, good deliverability)
 *                        needs RESEND_API_KEY
 *
 * Always needed for real sending: EMAIL_FROM, e.g.  "My Store <orders@mystore.com>"
 *
 * This file runs on the SERVER only; passwords and keys never reach the browser.
 */
import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** Plain-text version for email apps that don't show HTML */
  text: string;
  replyTo?: string;
}

export type SendResult = { ok: true; provider: string; id?: string } | { ok: false; provider: string; error: string };

const provider = (process.env.EMAIL_PROVIDER ?? "console").toLowerCase();
const from = process.env.EMAIL_FROM ?? "Store <no-reply@example.com>";

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  try {
    switch (provider) {
      case "smtp":
        return await sendWithSmtp(message);
      case "resend":
        return await sendWithResend(message);
      default:
        return await saveToPreviewFolder(message);
    }
  } catch (error) {
    // Never crash the checkout because of email; just log it
    console.error(`[email] ${provider} failed:`, error);
    return { ok: false, provider, error: error instanceof Error ? error.message : String(error) };
  }
}

/* ---------- console: save an HTML file you can open ---------- */
async function saveToPreviewFolder(message: EmailMessage): Promise<SendResult> {
  // On Vercel the project folder is read-only, so previews go to the temporary folder there
  const dir = process.env.VERCEL ? "/tmp/email-previews" : path.join(process.cwd(), ".email-previews");
  await mkdir(dir, { recursive: true });
  const safe = message.subject.replace(/[^\p{L}\p{N}-]+/gu, "_").slice(0, 60);
  const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}_${safe}.html`);
  await writeFile(file, message.html, "utf8");
  console.log(`[email] (console mode) to ${message.to} — "${message.subject}"\n        preview: ${file}`);
  return { ok: true, provider: "console", id: file };
}

/* ---------- smtp: any mail server ---------- */
async function sendWithSmtp(message: EmailMessage): Promise<SendResult> {
  const nodemailer = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  const info = await transport.sendMail({ from, ...message });
  return { ok: true, provider: "smtp", id: info.messageId };
}

/* ---------- resend.com (plain HTTPS call, no extra library) ---------- */
async function sendWithResend(message: EmailMessage): Promise<SendResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text, reply_to: message.replyTo }),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) return { ok: false, provider: "resend", error: data.message ?? `HTTP ${res.status}` };
  return { ok: true, provider: "resend", id: data.id };
}
