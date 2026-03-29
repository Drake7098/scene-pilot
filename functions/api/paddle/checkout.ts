/**
 * functions/api/paddle/checkout.ts — DISABLED
 * Paddle 结账已关闭，当前付款走 Whop。
 */
export const onRequestPost: PagesFunction = async () => {
  return new Response(
    JSON.stringify({ error: "paddle_disabled", message: "Paddle checkout is disabled. Use Whop." }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
};
