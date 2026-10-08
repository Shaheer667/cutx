"use client";

import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react";

import {
  TimelineClip,
  VideoTrack as VideoTrackType,
} from "@/types/editor";

import VideoClip from "./VideoClip";

type Props = {
  track: VideoTrackType;

  clips: TimelineClip[];

  trackHeight: number;

  pixelsPerSecond: number;

  selectedClipId:
    string | null;

  visible: boolean;
  locked: boolean;

  getFrames: (
    clip: TimelineClip,
    width: number
  ) => string[];

  onToggleVisibility:
    () => void;

  onToggleLock?:
    () => void;

  onTimelineClick: (
    event: React.MouseEvent<HTMLDivElement>
  ) => void;

  onSelectClip: (
    clip: TimelineClip
  ) => void;

  onDragStart: (
    event: React.MouseEvent,
    clip: TimelineClip
  ) => void;

  onTrimStart: (
    event: React.MouseEvent,
    clip: TimelineClip,
    side: "left" | "right"
  ) => void;
};

export default function VideoTrack({
  track,
  clips,
  trackHeight,
  pixelsPerSecond,
  selectedClipId,
  visible,
  locked,
  getFrames,
  onToggleVisibility,
  onToggleLock,
  onTimelineClick,
  onSelectClip,
  onDragStart,
  onTrimStart,
}: Props) {
  const trackClips =
    clips.filter(
      (clip) =>
        clip.track === track
    );

  const isOverlay =
    track === "V2";

  return (
    <div
      className="flex border-b border-[#171B21]"
      style={{
        height: `${trackHeight}px`,
      }}
    >
      {/* TRACK HEADER */}

      <div
        className="
          w-[88px]
          shrink-0
          border-r
          border-[#222630]
          bg-[#101319]
          flex
          items-center
          px-3
          gap-2
        "
      >
        <span
          className={`text-[10px] font-medium ${
            isOverlay
              ? "text-blue-300"
              : "text-white/70"
          }`}
        >
          {track}
        </span>

        {/* VISIBILITY */}

        <button
          onClick={
            onToggleVisibility
          }
          className={`
            ml-auto
            transition
            ${
              visible
                ? "text-white/40 hover:text-white"
                : "text-violet-300"
            }
          `}
          title={
            visible
              ? "Hide track"
              : "Show track"
          }
        >
          {visible ? (
            <Eye size={12} />
          ) : (
            <EyeOff size={12} />
          )}
        </button>

        {/* LOCK */}

        {onToggleLock && (
          <button
            onClick={
              onToggleLock
            }
            className={`
              transition
              ${
                locked
                  ? "text-violet-300"
                  : "text-white/30 hover:text-white"
              }
            `}
            title={
              locked
                ? "Unlock track"
                : "Lock track"
            }
          >
            {locked ? (
              <Lock size={11} />
            ) : (
              <Unlock size={11} />
            )}
          </button>
        )}
      </div>

      {/* CLIP AREA */}

      <div
        onClick={
          onTimelineClick
        }
        className="
          relative
          flex-1
          bg-[#0B0E13]
        "
      >
        {trackClips.map(
          (clip) => {
            const left =
              clip.timelineStart *
              pixelsPerSecond;

            const width =
              clip.duration *
              pixelsPerSecond;

            const frames =
              getFrames(
                clip,
                width
              );

            return (
              <VideoClip
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
                frames={
                  frames
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

        {/* EMPTY TRACK INDICATOR */}

        {!trackClips.length && (
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              px-3
              text-[9px]
              text-white/10
              pointer-events-none
            "
          >
            {track === "V2"
              ? "Drop B-roll / overlays here"
              : "Add main footage here"}
          </div>
        )}
      </div>
    </div>
  );
}