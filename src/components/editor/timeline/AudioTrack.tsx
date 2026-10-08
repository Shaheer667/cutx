"use client";

import {
  Lock,
  Unlock,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  TimelineClip,
} from "@/types/editor";

type Props = {
  clips: TimelineClip[];

  trackHeight: number;

  pixelsPerSecond: number;

  selectedClipId:
    string | null;

  muted: boolean;
  locked: boolean;

  getWaveform: (
    clip: TimelineClip,
    width: number
  ) => number[];

  onToggleMute:
    () => void;

  onToggleLock:
    () => void;

  onSelectClip: (
    clip: TimelineClip
  ) => void;

  onDragStart?: (
    event: React.MouseEvent,
    clip: TimelineClip
  ) => void;

  onTrimStart?: (
    event: React.MouseEvent,
    clip: TimelineClip,
    side: "left" | "right"
  ) => void;
};

export default function AudioTrack({
  clips,
  trackHeight,
  pixelsPerSecond,
  selectedClipId,
  muted,
  locked,
  getWaveform,
  onToggleMute,
  onToggleLock,
  onSelectClip,
  onDragStart,
  onTrimStart,
}: Props) {
  const audioClips =
    clips.filter(
      (clip) =>
        clip.track === "V1"
    );

  return (
    <div
      className="flex border-b border-[#171B21]"
      style={{
        height: `${trackHeight}px`,
      }}
    >
      {/* HEADER */}

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
        <span className="text-[10px] font-medium text-white/60">
          A1
        </span>

        {/* MUTE */}

        <button
          onClick={
            onToggleMute
          }
          className={`
            ml-auto
            transition
            ${
              muted
                ? "text-violet-300"
                : "text-white/35 hover:text-white"
            }
          `}
          title={
            muted
              ? "Unmute audio"
              : "Mute audio"
          }
        >
          {muted ? (
            <VolumeX size={12} />
          ) : (
            <Volume2 size={12} />
          )}
        </button>

        {/* LOCK */}

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
        >
          {locked ? (
            <Lock size={11} />
          ) : (
            <Unlock size={11} />
          )}
        </button>
      </div>

      {/* WAVEFORM AREA */}

      <div className="relative flex-1 bg-[#0B0E13]">

        {audioClips.map(
          (clip) => {
            const left =
              clip.timelineStart *
              pixelsPerSecond;

            const width =
              clip.duration *
              pixelsPerSecond;

            const waveform =
              getWaveform(
                clip,
                width
              );

            const selected =
              selectedClipId ===
              clip.id;

            return (
              <div
                key={`audio-${clip.id}`}
                onMouseDown={(
                  event
                ) => {
                  if (
                    locked ||
                    !onDragStart
                  )
                    return;

                  onDragStart(
                    event,
                    clip
                  );
                }}
                onClick={(
                  event
                ) => {
                  event.stopPropagation();

                  onSelectClip(
                    clip
                  );
                }}
                className={`
                  absolute
                  top-1
                  bottom-1
                  rounded-md
                  overflow-hidden
                  bg-violet-500/10
                  ${
                    locked
                      ? "cursor-default"
                      : "cursor-grab active:cursor-grabbing"
                  }
                  ${
                    selected
                      ? "border-2 border-violet-200"
                      : "border border-violet-500/20 hover:border-violet-400/40"
                  }
                `}
                style={{
                  left: `${left}px`,

                  width: `${Math.max(
                    width,
                    4
                  )}px`,
                }}
              >
                {/* WAVEFORM */}

                {waveform.length > 0 ? (
                  <div
                    className="
                      absolute
                      inset-0
                      flex
                      items-center
                      gap-[1px]
                      px-[2px]
                    "
                  >
                    {waveform.map(
                      (
                        value,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="
                            flex-1
                            min-w-[1px]
                            max-w-[3px]
                            rounded-full
                            bg-violet-300/75
                          "
                          style={{
                            height: `${Math.max(
                              3,
                              value *
                                Math.max(
                                  18,
                                  trackHeight -
                                    18
                                )
                            )}px`,
                          }}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white/20">
                    No waveform
                  </div>
                )}

                {/* LEFT TRIM */}

                {!locked &&
                  onTrimStart && (
                    <div
                      onMouseDown={(
                        event
                      ) => {
                        event.stopPropagation();

                        onTrimStart(
                          event,
                          clip,
                          "left"
                        );
                      }}
                      className={`
                        absolute
                        left-0
                        top-0
                        bottom-0
                        z-20
                        w-[6px]
                        cursor-ew-resize
                        ${
                          selected
                            ? "bg-violet-100"
                            : ""
                        }
                      `}
                    />
                  )}

                {/* RIGHT TRIM */}

                {!locked &&
                  onTrimStart && (
                    <div
                      onMouseDown={(
                        event
                      ) => {
                        event.stopPropagation();

                        onTrimStart(
                          event,
                          clip,
                          "right"
                        );
                      }}
                      className={`
                        absolute
                        right-0
                        top-0
                        bottom-0
                        z-20
                        w-[6px]
                        cursor-ew-resize
                        ${
                          selected
                            ? "bg-violet-100"
                            : ""
                        }
                      `}
                    />
                  )}

              </div>
            );
          }
        )}

      </div>
    </div>
  );
}