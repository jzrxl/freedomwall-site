export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  const msg = (form.get("message") || "").trim();
  if (!msg) return new Response("Empty", { status: 400 });

  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO;
  if (!token || !repo) return new Response("Server misconfigured", { status: 500 });

  // Convert UTC -> Philippine Time (UTC+8)
  const now = new Date();
  const ph = new Date(now.getTime() + 8 * 60 * 60 * 1000);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = ph.getUTCFullYear();
  const monthName = monthNames[ph.getUTCMonth()];
  const dayNum = ph.getUTCDate();

  // Build "11-56 AM" style
  let h = ph.getUTCHours();
  const minutes = String(ph.getUTCMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const time = `${h}-${minutes} ${ampm}`;

  // Folder structure: inbox/Month Year/Day Name/
  const monthFolder = `${monthName} ${year}`;
  const dayFolder = `${monthName} ${dayNum}`;
  const folder = `inbox/${monthFolder}/${dayFolder}`;

  // Find next available (n)
  let n = 1;
  let path;
  while (true) {
    path = `${folder}/(${n}) ${time}.md`;
    const check = await fetch(
      `https://api.github.com/repos/${repo}/contents/${encodePath(path)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "freedomwall",
        },
      }
    );
    if (check.status === 404) break;
    n++;
    if (n > 9999) return new Response("Too many today", { status: 429 });
  }

  const body = {
    message: `submission ${monthFolder}/${dayFolder} (${n}) ${time}`,
    content: btoa(unescape(encodeURIComponent(msg))),
  };

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodePath(path)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "freedomwall",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  return new Response(res.ok ? "OK" : "Error", { status: res.ok ? 200 : 500 });
}

// Encode each path segment but keep the slashes so GitHub sees a nested path
function encodePath(p) {
  return p.split('/').map(encodeURIComponent).join('/');
}
