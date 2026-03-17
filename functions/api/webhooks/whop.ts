export const onRequestPost = async ({ request, env }: { request: Request; env: { WHOP_WEBHOOK_SECRET: string; SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string } }) => {
  console.log("WHOP WEBHOOK HIT", request.method);
  const body = await request.text();
  const sig = request.headers.get("whop-signature") ?? "";

  // 验证签名
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(env.WHOP_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedHex = Array.from(new Uint8Array(expected))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  if (expectedHex !== sig) return new Response("Unauthorized", { status: 401 });

  const event = JSON.parse(body);
  const action = event.action;
  const userEmail = event.data?.user?.email;
  const planId = event.data?.plan?.id;

  const CREDIT_MAP: Record<string, number> = {
    "plan_S9Y9sX4nIH7M2": 150,
    "plan_LsyYESGY0fqI9": 420,
    "plan_00vbsXkjSR9jA": 800,
  };

  if (action === "membership_activated" && userEmail && CREDIT_MAP[planId]) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/add_user_credits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": env.SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ user_email: userEmail, amount: CREDIT_MAP[planId] }),
    });
  }

  return new Response("ok", { status: 200 });
};
