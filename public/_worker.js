export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/webhooks/whop") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      return new Response("Whop webhook placeholder", { status: 200 });
    }

    return env.ASSETS.fetch(request);
  }
};
