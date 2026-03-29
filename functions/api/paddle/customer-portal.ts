/**
 * functions/api/paddle/customer-portal.ts — DISABLED
 * 客户门户已关闭，由 Whop 管理。
 */
export const onRequestPost: PagesFunction = async () => {
  return new Response(
    JSON.stringify({ error: "paddle_disabled", message: "Customer portal is managed via Whop." }),
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
