import type { ApiCredentialState, ApiProviderId, ApiProviderMode } from "../types/account";
import { getApiAuthHeaders } from "./authService";

export type GenerationGatewayPayload = {
  userId?: string;
  provider: ApiProviderId;
  mode: ApiProviderMode;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  prompt: string;
  mediaType: "image" | "video";
  ratio?: string;
  promptImage?: string;
  duration?: number;
};

export type GenerationGatewayResult = {
  ok: boolean;
  provider: ApiProviderId;
  mode: ApiProviderMode;
  mediaType: "image" | "video";
  taskId?: string;
  status?: string;
  output?: unknown;
  raw?: unknown;
  error?: string;
};

export type ProviderSnapshot = {
  ok: boolean;
  providers: Record<string, {
    provider: ApiProviderId;
    platformConfigured: boolean;
    defaultBaseUrl: string;
    recommendedModels: string[];
  }>;
};

export function buildProviderPayload(
  credentials: ApiCredentialState,
  mediaType: "image" | "video",
  prompt: string,
  userId?: string
): GenerationGatewayPayload {
  const providerId = credentials.defaultProvider;
  const provider = credentials[providerId];
  return {
    userId,
    provider: providerId,
    mode: provider.mode,
    apiKey: provider.mode === "personal" ? provider.apiKey : "",
    baseUrl: provider.baseUrl,
    model: provider.preferredModel,
    prompt,
    mediaType
  };
}

export async function fetchProviderSnapshot(): Promise<ProviderSnapshot | null> {
  try {
    const res = await fetch("/api/generation/providers", {
      headers: await getApiAuthHeaders()
    });
    if (!res.ok) return null;
    return await res.json() as ProviderSnapshot;
  } catch {
    return null;
  }
}

export async function submitHostedGeneration(payload: GenerationGatewayPayload): Promise<GenerationGatewayResult | null> {
  try {
    const userId = payload.userId?.trim() || "";
    const authHeaders = await getApiAuthHeaders(userId || undefined);
    const res = await fetch("/api/generation/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify(payload)
    });
    return await res.json() as GenerationGatewayResult;
  } catch {
    return null;
  }
}

export async function fetchHostedGenerationStatus(
  payload: Pick<GenerationGatewayPayload, "userId" | "provider" | "mode" | "apiKey" | "baseUrl" | "model" | "mediaType"> & { taskId: string }
): Promise<GenerationGatewayResult | null> {
  try {
    const userId = payload.userId?.trim() || "";
    const authHeaders = await getApiAuthHeaders(userId || undefined);
    const res = await fetch("/api/generation/status", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify(payload)
    });
    return await res.json() as GenerationGatewayResult;
  } catch {
    return null;
  }
}
