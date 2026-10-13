"use client";

import {
  Lock,
  Type,
  Unlock,
} from "lucide-react";

import {
  TimelineClip,
} from "@/types/editor";

import TextClip from "./TextClip";

type Props = {
  clips:
    TimelineClip[];

  pixelsPerSecond:
    number;

  selectedClipId:
    string | null;

  locked: boolean;

  onToggleLock:
    () => void;

  onTimelineClick: (
    event:
      React.MouseEvent<HTMLDivElement>
  ) => void;

  onSelectClip: (
    clip: TimelineClip
  ) => void;

  onDragStart: (
    event:
      React.MouseEvent,

    clip:
      TimelineClip
  ) => void;

  onTrimStart: (
    event:
      React.MouseEvent,

    clip:
      TimelineClip,

    side:
      | "left"
      | "right"
  ) => void;
};

export default function TextTrack({
  clips,
  pixelsPerSecond,
  selectedClipId,
  locked,
  onToggleLock,
  onTimelineClick,
  onSelectClip,
  onDragStart,
  onTrimStart,
}: Props) {
  const textClips =
    clips.filter(
      (clip) =>
        clip.kind ===
        "text"
    );

  return (
    <div className="flex h-[52px] border-b border-[#171B21]">
      {/* HEADER */}

      <div className="w-[88px] shrink-0 border-r border-[#222630] bg-[#101319] flex items-center px-3 gap-2">
        <Type
          size={11}
          className="text-fuchsia-300"
        />

        <span className="text-[10px] font-medium text-fuchsia-200">
          T1
        </span>

        <button
          onClick={
            onToggleLock
          }
          title={
            locked
              ? "Unlock timeline"
              : "Lock timeline"
          }
          className={`ml-auto transition ${
            locked
              ? "text-violet-300"
              : "text-white/30 hover:text-white"
          }`}
        >
          {locked ? (
            <Lock
              size={11}
            />
          ) : (
            <Unlock
              size={11}
            />
          )}
        </button>
      </div>

      {/* TEXT CLIP AREA */}

      <div
        onClick={
          onTimelineClick
        }
        className="relative flex-1 bg-[#0B0E13]"
      >
        {textClips.map(
          (clip) => {
            const left =
              clip.timelineStart *
              pixelsPerSecond;

            const width =
              clip.duration *
              pixelsPerSecond;

            return (
              <TextClip
                key={
                  clip.id
                }
                clip={
                  clip
                }
                left={
                  left
                }
                width={
                  width
                }
                selected={
                  selectedClipId ===
                  clip.id
                }
                locked={
                  locked
                }
                onSelect={
                  onSelectClip
                }
                onDragStart={
                  onDragStart
                }
                onTrimStart={
                  onTrimStart
                }
              />
            );
          }
        )}

        {!textClips.length && (
          <div className="absolute inset-0 flex items-center px-3 text-[9px] text-white/10 pointer-events-none">
            Text clips
            appear here
          </div>
        )}
      </div>
    </div>
  );
}