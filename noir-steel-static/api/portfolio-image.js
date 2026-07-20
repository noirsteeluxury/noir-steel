function validPath(value) {
  return /^[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i.test(value || "");
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const path = String(req.query.path || "");
  if (!validPath(path)) return res.status(400).end("Nieprawidłowa ścieżka");

  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return res.status(500).end("Brak konfiguracji");

  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${url}/storage/v1/object/authenticated/lead-photos/${encoded}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!response.ok) return res.status(response.status).end();

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
  res.status(200).send(buffer);
};
