export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  const msg = (form.get("message") || "").trim();
  if (!msg) return new Response("Empty", { status: 400 });

  const now = new Date();
  const day =
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0") + "-" +
    now.getFullYear();

  let n = 1;
  let path;

  while (true) {
    path = `inbox/${day}(${n}).md`;
    const check = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "User-Agent": "freedomwall",
        },
      }
    );
    if (check.status === 404) break;
    n++;
    if (n > 9999) return new Response("Too many today", { status: 429 });
  }

  const body = {
    message: `submission ${day}(${n})`,
    content: btoa(unescape(encodeURIComponent(msg))),
  };

  const res = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "User-Agent": "freedomwall",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  return new Response(res.ok ? "OK" : "Error", { status: res.ok ? 200 : 500 });
}
