/**
 * Upstash Redis 最小工具封装
 * 用于 Cloudflare Pages Functions
 * 只使用 Upstash REST API，不依赖 Redis 客户端库
 */

export function createUpstashClient(env: any) {
  const url = String(env?.UPSTASH_REDIS_REST_URL || "").trim();
  const token = String(env?.UPSTASH_REDIS_REST_TOKEN || "").trim();

  async function request<T = any>(
    command: string,
    ...args: (string | number)[]
  ): Promise<T> {
    if (!url || !token) {
      throw new Error("Upstash Redis not configured");
    }

    const requestUrl = `${url}/${command}/${args.map(encodeURIComponent).join("/")}`;

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstash request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`Upstash error: ${result.error}`);
    }

    return result.result;
  }

  return {
    async get(key: string): Promise<string | null> {
      try {
        const result = await request("GET", key);
        return result ?? null;
      } catch {
        return null;
      }
    },

    async set(
      key: string,
      value: string,
      exSeconds?: number
    ): Promise<boolean> {
      try {
        const args = [key, value];
        if (exSeconds) {
          args.push("EX", String(exSeconds));
        }
        const result = await request("SET", ...args);
        return result === "OK";
      } catch {
        return false;
      }
    },

    async del(key: string): Promise<boolean> {
      try {
        const result = await request("DEL", key);
        return result > 0;
      } catch {
        return false;
      }
    },

    async setIfNotExists(
      key: string,
      value: string,
      exSeconds?: number
    ): Promise<boolean> {
      try {
        const args = [key, value, "NX"];
        if (exSeconds) {
          args.push("EX", String(exSeconds));
        }
        const result = await request("SET", ...args);
        return result === "OK";
      } catch {
        return false;
      }
    },
  };
}

export type UpstashClient = ReturnType<typeof createUpstashClient>;
