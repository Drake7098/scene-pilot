export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/api/webhooks/whop") {
        if (request.method === "GET") {
          return new Response("Method Not Allowed", { status: 405, headers: { "Content-Type": "text/plain" } });
        }
        if (request.method === "POST") {
          try {
            const body = await request.text();
            const sig = request.headers.get("whop-signature") ?? "";

            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
              "raw",
              encoder.encode(env.WHOP_WEBHOOK_SECRET),
              { name: "HMAC", hash: "SHA-256" },
              false,
              ["sign"]
            );
            const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
            const expectedHex = Array.from(new Uint8Array(expected))
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
            if (expectedHex !== sig) return new Response("Unauthorized", { status: 401 });

            const event = JSON.parse(body);
            const action = event.action;
            const userEmail = event.data?.user?.email;
            const planId = event.data?.plan?.id;

            const CREDIT_MAP = {
              plan_S9Y9sX4nIH7M2: 150,
              plan_LsyYESGY0fqI9: 420,
              plan_00vbsXkjSR9jA: 800,
            };

            if (action === "membership_activated" && userEmail && CREDIT_MAP[planId]) {
              await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/add_user_credits`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: env.SUPABASE_SERVICE_KEY,
                  Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                },
                body: JSON.stringify({
                  user_email: userEmail,
                  amount: CREDIT_MAP[planId],
                }),
              });
            }

            return new Response("ok", { status: 200 });
          } catch (e) {
            return new Response("Internal Server Error: " + e.message, {
              status: 500,
              headers: { "Content-Type": "text/plain" },
            });
          }
        }
        return new Response("Method Not Allowed", { status: 405, headers: { "Content-Type": "text/plain" } });
      }

      // SPA fallback：先尝试静态资源，404 时回退到 index.html
      if (!env.ASSETS) {
        return new Response("ASSETS binding unavailable", { status: 500, headers: { "Content-Type": "text/plain" } });
      }
      const res = await env.ASSETS.fetch(request);
      if (res.status === 404) {
        const assetUrl = new URL("/index.html", request.url);
        const indexRes = await env.ASSETS.fetch(new Request(assetUrl.toString()));
        return new Response(indexRes.body, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=UTF-8" },
        });
      }
      return res;
    } catch (err) {
      return new Response("Internal Server Error: " + err.message, {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }
  },
};
