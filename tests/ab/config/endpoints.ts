export type ProviderName = "replicate" | "fal";
export type TaskType = "image" | "video";
export type CostHint = "low" | "mid" | "high";

export type EndpointConfig = {
  provider: ProviderName;
  id: string;
  taskType: TaskType;
  endpoint: string;
  costHint: CostHint;
  sourceUrl: string;
  defaultInput: Record<string, unknown>;
  estimateCostUsd: (params: { resolution?: string; durationSec?: number; aspectRatio?: string }) => number;
};

function megapixelsFromResolution(resolution = "1024x1024"): number {
  const match = resolution.match(/(\d+)x(\d+)/i);
  if (!match) return 1;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return Math.max(1, Math.ceil((width * height) / 1_000_000));
}

export const IMAGE_ENDPOINTS: EndpointConfig[] = [
  {
    provider: "replicate",
    id: "replicate_flux_schnell",
    taskType: "image",
    endpoint: "black-forest-labs/flux-schnell",
    costHint: "low",
    sourceUrl: "https://replicate.com/black-forest-labs/flux-schnell",
    defaultInput: {
      num_outputs: 1,
      num_inference_steps: 4,
      output_format: "png",
      go_fast: true,
      megapixels: 1
    },
    estimateCostUsd: ({ resolution }) => 0.003 * megapixelsFromResolution(resolution)
  },
  {
    provider: "replicate",
    id: "replicate_flux_2_dev",
    taskType: "image",
    endpoint: "black-forest-labs/flux-2-dev",
    costHint: "mid",
    sourceUrl: "https://replicate.com/blog/run-flux-2-on-replicate",
    defaultInput: {
      output_format: "png",
      num_outputs: 1,
      safety_tolerance: 2
    },
    estimateCostUsd: ({ resolution }) => 0.015 * megapixelsFromResolution(resolution)
  },
  {
    provider: "fal",
    id: "fal_flux_schnell",
    taskType: "image",
    endpoint: "fal-ai/flux/schnell",
    costHint: "low",
    sourceUrl: "https://fal.ai/models/fal-ai/flux",
    defaultInput: {
      image_size: "square_hd",
      num_inference_steps: 4,
      num_images: 1,
      output_format: "png"
    },
    estimateCostUsd: ({ resolution }) => 0.003 * megapixelsFromResolution(resolution)
  },
  {
    provider: "fal",
    id: "fal_flux_dev",
    taskType: "image",
    endpoint: "fal-ai/flux/dev",
    costHint: "mid",
    sourceUrl: "https://fal.ai/models/fal-ai/flux/dev",
    defaultInput: {
      image_size: "square_hd",
      num_images: 1,
      guidance_scale: 3.5,
      output_format: "png"
    },
    estimateCostUsd: ({ resolution }) => 0.025 * megapixelsFromResolution(resolution)
  }
];

export const VIDEO_ENDPOINTS: EndpointConfig[] = [
  {
    provider: "replicate",
    id: "replicate_minimax_video_01_director",
    taskType: "video",
    endpoint: "minimax/video-01-director",
    costHint: "high",
    sourceUrl: "https://replicate.com/minimax/video-01-director",
    defaultInput: {
      duration: 5,
      output_format: "mp4"
    },
    estimateCostUsd: ({ durationSec }) => Number(((durationSec ?? 5) * 0.08).toFixed(3))
  },
  {
    provider: "fal",
    id: "fal_longcat_video_distilled_480p",
    taskType: "video",
    endpoint: "fal-ai/longcat-video/distilled/text-to-video/480p",
    costHint: "low",
    sourceUrl: "https://fal.ai/models/fal-ai/longcat-video/distilled/text-to-video/480p",
    defaultInput: {
      fps: 15,
      output_format: "mp4"
    },
    estimateCostUsd: ({ durationSec }) => Number(((durationSec ?? 5) * 0.005).toFixed(3))
  }
];

export function findEndpoint(taskType: TaskType, id: string): EndpointConfig {
  const pool = taskType === "image" ? IMAGE_ENDPOINTS : VIDEO_ENDPOINTS;
  const found = pool.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown endpoint: ${id}`);
  return found;
}
