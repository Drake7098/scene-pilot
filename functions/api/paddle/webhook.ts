/**
 * functions/api/paddle/webhook.ts — DISABLED
 * Paddle webhook 已关闭，当前付款走 Whop。
 * 保留文件避免 Cloudflare Pages 路由 404，返回 200 防止 Paddle 重试风暴。
 */
export const onRequestPost: PagesFunction = async () => {
  return new Response(
    JSON.stringify({ ok: true, message: "paddle_disabled" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
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
