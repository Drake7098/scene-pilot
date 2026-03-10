import React from "react";
import type { CanvasDraft } from "../types/canvasDraft";
import { ImageCanvasView } from "./ImageCanvasView";
import { VideoCanvasView } from "./VideoCanvasView";

type Props = {
  draft: CanvasDraft;
  onChange: (next: CanvasDraft) => void;
};

export function StructureCanvasLite({ draft, onChange }: Props) {
  if (draft.mediaType === "image") {
    return <ImageCanvasView draft={draft} onChange={(next) => onChange(next)} />;
  }
  return <VideoCanvasView draft={draft} onChange={(next) => onChange(next)} />;
}
