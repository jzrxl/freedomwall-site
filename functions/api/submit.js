export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  const msg = (form.get("message") || "").trim();
  const imageBase64 = form.get("imageBase64");
  const imageExt = form.get("imageExt");
  
  const hasImage = typeof imageBase64 === "string" && imageBase64.length > 1000;
  if (!msg && !hasImage) return new Response("Empty", { status: 400 });

  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO;
  if (!token || !repo) return new Response("Server misconfigured", { status: 500 });

  const now = new Date();
  const ph = new Date(now.getTime() + 8 * 60 * 60 * 1000); // PHT

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const year = ph.getUTCFullYear();
  const monthName = monthNames[ph.getUTCMonth()];
  const dayNum = ph.getUTCDate();

  let h = ph.getUTCHours();
  const minutes = String(ph.getUTCMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const time = `${h}-${minutes} ${ampm}`;

  const folder = `inbox/${monthName} ${year}/${monthName} ${dayNum}`;

  let maxN = 0;
  const listRes = await fetch(`https://api.github.com/repos/${repo}/contents/${encodePath(folder)}`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "freedomwall" },
  });

  if (listRes.ok) {
    const items = await listRes.json();
    if (Array.isArray(items)) {
      for (const item of items) {
        const match = item.name.match(/^\((\d+)\)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxN) maxN = num;
        }
      }
    }
  }

  const n = maxN + 1;
  const padded = String(n).padStart(2, "0");
  const baseName = `(${padded}) ${time}`;
  
  const mdPath = `${folder}/${baseName}.md`;
  const imgPath = hasImage ? `${folder}/${baseName}.${imageExt}` : null;
  
  // 1. Commit the image if present
  if (hasImage) {
    const imgRes = await fetch(`https://api.github.com/repos/${repo}/contents/${encodePath(imgPath)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "freedomwall", "Content-Type": "application/json" },
      body: JSON.stringify({ message: `image ${baseName}`, content: imageBase64 }),
    });
    if (!imgRes.ok) return new Response("Image upload failed", { status: 500 });
  }

  // 2. Prepare Markdown content
  let mdContent = msg;
  if (hasImage) {
    mdContent = `![image](${baseName}.${imageExt})\n\n${msg}`;
  }

  // 3. Commit the Markdown file
  const mdRes = await fetch(`https://api.github.com/repos/${repo}/contents/${encodePath(mdPath)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "freedomwall", "Content-Type": "application/json" },
    body: JSON.stringify({ 
      message: `submission ${baseName}`, 
      content: btoa(unescape(encodeURIComponent(mdContent))) 
    }),
  });

  return new Response(mdRes.ok ? "OK" : "Error", { status: mdRes.ok ? 200 : 500 });
}

function encodePath(p) {
  return p.split('/').map(encodeURIComponent).join('/');
}
