// Proxy uploads from the browser to catbox.moe so we sidestep the lack of
// CORS headers on the Catbox API. Forwards the multipart body, attaches our
// userhash, and returns the resulting public URL.

const CATBOX_API = "https://catbox.moe/user/api.php";
const USERHASH = "c2e6a266ebe699a31dbd465ba";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Max-Age": "86400",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const inForm = await req.formData();
    const file = inForm.get("fileToUpload");
    if (!(file instanceof File) && !(file instanceof Blob)) {
      return json({ error: "Missing fileToUpload" }, 400);
    }
    const filename =
      (file as File).name ?? `upload-${Date.now()}.bin`;

    const fd = new FormData();
    fd.append("reqtype", "fileupload");
    fd.append("userhash", USERHASH);
    fd.append("fileToUpload", file, filename);

    const res = await fetch(CATBOX_API, { method: "POST", body: fd });
    const text = (await res.text()).trim();
    if (!res.ok || !text.startsWith("https://")) {
      return json({ error: `Catbox rejected upload: ${text || res.status}` }, 502);
    }
    return json({ url: text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload proxy failed";
    return json({ error: msg }, 500);
  }
});
