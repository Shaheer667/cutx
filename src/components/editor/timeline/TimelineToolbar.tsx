"use client";

import {
  ChevronsLeft,
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { formatTime } from "@/utils/time";

type Props = {
  selectedClipId: string | null;

  currentTime: number;

  zoom: number;

  locked: boolean;

  onSplit: () => void;

  onDelete: () => void;

  onRippleDelete: () => void;

  onZoomIn: () => void;

  onZoomOut: () => void;
};

export default function TimelineToolbar({
  selectedClipId,
  currentTime,
  zoom,
  locked,
  onSplit,
  onDelete,
  onRippleDelete,
  onZoomIn,
  onZoomOut,
}: Props) {
  return (
    <div className="h-11 shrink-0 border-b border-[#222630] px-4 flex items-center gap-2">

      <button
        onClick={onSplit}
        disabled={locked}
        className="h-8 px-3 rounded-lg flex items-center gap-2 text-xs hover:bg-white/5 disabled:opacity-30"
      >
        <Scissors size={14} />

        Split
      </button>

      <button
        onClick={onDelete}
        disabled={!selectedClipId || locked}
        className="h-8 px-3 rounded-lg flex items-center gap-2 text-xs hover:bg-white/5 disabled:opacity-30"
      >
        <Trash2 size={14} />

        Delete
      </button>

      <button
        onClick={onRippleDelete}
        disabled={!selectedClipId || locked}
        className="h-8 px-3 rounded-lg flex items-center gap-2 text-xs hover:bg-white/5 disabled:opacity-30"
      >
        <ChevronsLeft size={14} />

        Ripple
      </button>

      <div className="h-5 w-px bg-[#2A3039] mx-1" />

      <span className="text-xs text-white/40 tabular-nums">
        {formatTime(currentTime)}
      </span>

      <div className="ml-auto flex items-center gap-2">

        <button
          onClick={onZoomOut}
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/5"
        >
          <ZoomOut size={14} />
        </button>

        <span className="w-10 text-center text-[10px] text-white/50">
          {zoom}%
        </span>

        <button
          onClick={onZoomIn}
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/5"
        >
          <ZoomIn size={14} />
        </button>

      </div>

    </div>
  );
}