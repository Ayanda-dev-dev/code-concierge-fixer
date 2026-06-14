// Catbox.moe anonymous upload helper.
// Browsers can NOT POST directly to https://catbox.moe/user/api.php — that
// host returns no CORS headers, so a direct fetch fails with "Failed to
// fetch". We send the file to our own server route, which forwards it to
// Catbox and returns the resulting public URL.

const CATBOX_PROXY = "/api/public/catbox/upload";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB cap for our use case
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export class CatboxError extends Error {
  constructor(message: string, public code: "size" | "type" | "network" | "server") {
    super(message);
  }
}

/**
 * Upload a File or Blob to Catbox via our server-side proxy.
 * Returns the public URL on success.
 */
export async function uploadToCatbox(
  file: File | Blob,
  filename?: string,
): Promise<string> {
  if (typeof window === "undefined") {
    throw new CatboxError("Catbox upload must run in the browser", "network");
  }

  const size = file.size;
  if (size === 0) throw new CatboxError("File is empty", "size");
  if (size > MAX_BYTES) {
    throw new CatboxError(
      `File too large (${(size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.`,
      "size",
    );
  }

  const type = (file as File).type || "application/octet-stream";
  if (!ALLOWED_MIME.has(type)) {
    throw new CatboxError(
      `File type "${type}" not allowed. Use JPG, PNG, WEBP or PDF.`,
      "type",
    );
  }

  const fd = new FormData();
  const name =
    filename ??
    (file as File).name ??
    `upload-${Date.now()}.${type.split("/")[1] ?? "bin"}`;
  fd.append("fileToUpload", file, name);

  let res: Response;
  try {
    res = await fetch(CATBOX_PROXY, { method: "POST", body: fd });
  } catch (e) {
    throw new CatboxError(
      `Could not reach upload service: ${e instanceof Error ? e.message : "network error"}`,
      "network",
    );
  }

  let payload: { url?: string; error?: string } = {};
  try {
    payload = (await res.json()) as { url?: string; error?: string };
  } catch {
    throw new CatboxError(`Upload service returned ${res.status}`, "server");
  }

  if (!res.ok || !payload.url) {
    throw new CatboxError(payload.error ?? `Upload failed (${res.status})`, "server");
  }
  return payload.url;
}

/** Convert a data URL (e.g. from canvas.toDataURL()) into a Blob suitable for upload. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:([^;]+);base64/.exec(meta)?.[1] ?? "image/png";
  const bin = atob(b64);
  const len = bin.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf], { type: mime });
}
