// Server-side proxy for Catbox uploads.
// Browsers can't POST directly to https://catbox.moe/user/api.php — that
// host returns no CORS headers, so the fetch fails with "Failed to fetch".
// This route runs on the server (no CORS), forwards the multipart body to
// Catbox, and returns the resulting public URL to the browser.

import { createFileRoute } from "@tanstack/react-router";

const CATBOX_API = "https://catbox.moe/user/api.php";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/public/catbox/upload")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const file = form.get("fileToUpload") as unknown;
          if (!(file && typeof file === "object" && "size" in (file as object) && "type" in (file as object))) {
            return new Response(
              JSON.stringify({ error: "Missing fileToUpload" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
              },
            );
          }

          // Rebuild the multipart body the way Catbox expects.
          const fd = new FormData();
          fd.append("reqtype", "fileupload");
          const filename =
            (file as { name?: string }).name ?? `upload-${Date.now()}.bin`;
          fd.append("fileToUpload", file as Blob, filename);

          const upstream = await fetch(CATBOX_API, { method: "POST", body: fd });
          const text = (await upstream.text()).trim();

          if (!upstream.ok || !text.startsWith("https://")) {
            return new Response(
              JSON.stringify({
                error: `Catbox rejected upload: ${text || upstream.status}`,
              }),
              {
                status: 502,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
              },
            );
          }

          return new Response(JSON.stringify({ url: text }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upload proxy failed";
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
          });
        }
      },
    },
  },
});
