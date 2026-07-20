const jsonHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" };

function env() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Brak konfiguracji Supabase.");
  return { url, key };
}

async function rest(path) {
  const { url, key } = env();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Błąd pobierania portfolio.");
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const leads = await rest("leads?select=id,updated_at,portfolio_title,portfolio_description,portfolio_cover_photo_id,table_type,dimensions,shape,sinter,base_type&portfolio_published=eq.true&order=updated_at.desc");
    const items = await Promise.all(leads.map(async (lead) => {
      const photos = await rest(`lead_photos?select=id,storage_path,file_name,created_at&lead_id=eq.${lead.id}&order=created_at.asc`);
      const ordered = [...photos].sort((a, b) => {
        if (a.id === lead.portfolio_cover_photo_id) return -1;
        if (b.id === lead.portfolio_cover_photo_id) return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      return {
        id: lead.id,
        title: lead.portfolio_title || "Realizacja Noir Steel",
        description: lead.portfolio_description || [lead.table_type, lead.dimensions, lead.shape].filter(Boolean).join(" · "),
        photos: ordered.map((photo) => ({
          id: photo.id,
          alt: `${lead.portfolio_title || "Realizacja Noir Steel"} — ${photo.file_name}`,
          url: `/api/portfolio-image?path=${encodeURIComponent(photo.storage_path)}`
        }))
      };
    }));
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({ items: items.filter((item) => item.photos.length > 0) }));
  } catch (error) {
    console.error("Portfolio API error:", error);
    res.status(500).json({ error: "Nie udało się pobrać realizacji." });
  }
};
