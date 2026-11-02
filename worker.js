const APK_PATH = "/download/holosnyk-android.apk";
const APK_KEY = "holosnyk-android.apk";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env);
    }

    if (url.pathname === APK_PATH && (request.method === "GET" || request.method === "HEAD")) {
      return handleApkDownload(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

function plainText(message, status) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

async function handleApkDownload(request, env) {
  if (!env.DOWNLOADS) {
    return plainText("Завантаження тимчасово недоступне.", 503);
  }
  const head = request.method === "HEAD";
  const obj = head ? await env.DOWNLOADS.head(APK_KEY) : await env.DOWNLOADS.get(APK_KEY);
  if (!obj) {
    return plainText("Файл не знайдено.", 404);
  }
  const headers = new Headers({
    "content-type": "application/vnd.android.package-archive",
    "content-disposition": 'attachment; filename="holosnyk-android.apk"',
    "content-length": String(obj.size),
    "cache-control": "public, max-age=300",
    "x-content-type-options": "nosniff",
  });
  if (obj.httpEtag) headers.set("etag", obj.httpEtag);
  return new Response(head ? null : obj.body, { status: 200, headers });
}

async function handleContact(request, env) {
  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const name = (data.name || "").toString().trim().slice(0, 200);
  const contact = (data.contact || "").toString().trim().slice(0, 200);
  const message = (data.message || "").toString().trim().slice(0, 4000);
  const honeypot = (data.website || "").toString().trim();

  if (honeypot) {
    return json({ ok: true });
  }

  if (!name || !contact || !message) {
    return json({ ok: false, error: "missing_fields" }, 400);
  }

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ ok: false, error: "not_configured" }, 500);
  }

  const text =
    "Нове звернення з сайту golosnik.com.ua\n\n" +
    "Ім'я: " + name + "\n" +
    "Контакт: " + contact + "\n\n" +
    message;

  const tgUrl = "https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage";
  const tgResp = await fetch(tgUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: text,
    }),
  });

  if (!tgResp.ok) {
    return json({ ok: false, error: "telegram_failed" }, 502);
  }

  return json({ ok: true });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json" },
  });
}
