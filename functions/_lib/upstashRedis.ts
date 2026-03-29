/**
 * Upstash Redis 最小工具封装
 * 用于 Cloudflare Pages Functions
 * 只使用 Upstash REST API，不依赖 Redis 客户端库
 * 当前定位：轻量运行状态 / 缓存 / 运营可见性，不承担产品心智
 */

export function describeUpstashRuntime(env: any) {
  const url = String(env?.UPSTASH_REDIS_REST_URL || "").trim();
  const token = String(env?.UPSTASH_REDIS_REST_TOKEN || "").trim();
  return {
    configured: Boolean(url && token),
    mode: "runtime-cache"
  } as const;
}

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
    isConfigured(): boolean {
      return Boolean(url && token);
    },

    async raw<T = any>(command: string, ...args: (string | number)[]): Promise<T> {
      return request<T>(command, ...args);
    },

    async ping(): Promise<boolean> {
      try {
        const result = await request<string>("PING");
        return String(result || "").toUpperCase() === "PONG";
      } catch {
        return false;
      }
    },

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

    async lpush(key: string, ...values: string[]): Promise<number> {
      if (!values.length) return 0;
      try {
        const result = await request<number>("LPUSH", key, ...values);
        return Number(result || 0);
      } catch {
        return 0;
      }
    },

    async rpop(key: string): Promise<string | null> {
      try {
        const result = await request<string | null>("RPOP", key);
        return result ?? null;
      } catch {
        return null;
      }
    },

    async llen(key: string): Promise<number> {
      try {
        const result = await request<number>("LLEN", key);
        return Number(result || 0);
      } catch {
        return 0;
      }
    },

    async lpos(key: string, value: string): Promise<number | null> {
      try {
        const result = await request<number | null>("LPOS", key, value);
        if (result === null || result === undefined) return null;
        const n = Number(result);
        return Number.isFinite(n) ? n : null;
      } catch {
        return null;
      }
    },

    async incr(key: string): Promise<number> {
      try {
        const result = await request<number>("INCR", key);
        return Number(result || 0);
      } catch {
        return 0;
      }
    },

    async decr(key: string): Promise<number> {
      try {
        const result = await request<number>("DECR", key);
        return Number(result || 0);
      } catch {
        return 0;
      }
    }
  };
}

export type UpstashClient = ReturnType<typeof createUpstashClient>;
