"use client";

import {
  Pause,
  Play,
} from "lucide-react";

import {
  MediaItem,
  TimelineClip,
} from "@/types/editor";

import {
  formatTime,
} from "@/utils/time";

type Props = {
  v1VideoRef:
    React.RefObject<HTMLVideoElement | null>;

  v2VideoRef:
    React.RefObject<HTMLVideoElement | null>;

  activeV1Media:
    MediaItem | null;

  activeV2Media:
    MediaItem | null;

  activeV1Clip:
    TimelineClip | null;

  activeV2Clip:
    TimelineClip | null;

  activeTextClip:
    TimelineClip | null;

  v1Visible: boolean;

  v2Visible: boolean;

  audioMuted: boolean;

  isPlaying: boolean;

  currentTime: number;

  projectDuration: number;

  onTogglePlay:
    () => void;

  onV1TimeUpdate:
    () => void;

  onV1LoadedMetadata:
    () => void;

  onV2LoadedMetadata:
    () => void;
};

function clipStyle(
  clip:
    TimelineClip | null,

  visible = true
):
  React.CSSProperties {
  if (!clip) {
    return {};
  }

  const {
    x,
    y,
    scale,
    rotation,
    opacity,
  } =
    clip.transform;

  return {
    transform: `
      translate(
        ${x}px,
        ${y}px
      )
      scale(
        ${scale / 100}
      )
      rotate(
        ${rotation}deg
      )
    `,

    transformOrigin:
      "center center",

    opacity:
      visible
        ? opacity / 100
        : 0,
  };
}

export default function PreviewPanel({
  v1VideoRef,
  v2VideoRef,
  activeV1Media,
  activeV2Media,
  activeV1Clip,
  activeV2Clip,
  activeTextClip,
  v1Visible,
  v2Visible,
  audioMuted,
  isPlaying,
  currentTime,
  projectDuration,
  onTogglePlay,
  onV1TimeUpdate,
  onV1LoadedMetadata,
  onV2LoadedMetadata,
}: Props) {
  return (
    <section className="flex-1 min-w-0 flex flex-col bg-[#090B0F]">
      {/* PREVIEW */}

      <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-3 overflow-hidden">
        <div className="relative aspect-video w-[min(96%,1100px)] max-h-[96%] bg-black rounded-xl overflow-hidden border border-[#242933] shadow-2xl shadow-black/40">
          {/* V1 */}

          {activeV1Media &&
            activeV1Clip?.kind ===
              "video" && (
              <video
                ref={
                  v1VideoRef
                }
                key={
                  activeV1Media.id
                }
                src={
                  activeV1Media.url
                }
                muted={
                  audioMuted
                }
                onLoadedMetadata={
                  onV1LoadedMetadata
                }
                onTimeUpdate={
                  onV1TimeUpdate
                }
                style={
                  clipStyle(
                    activeV1Clip,
                    v1Visible
                  )
                }
                className="absolute inset-0 w-full h-full object-contain transition-opacity duration-75"
              />
            )}

          {/* V2 */}

          {activeV2Media &&
            activeV2Clip?.kind ===
              "video" && (
              <video
                ref={
                  v2VideoRef
                }
                key={
                  activeV2Media.id
                }
                src={
                  activeV2Media.url
                }
                muted
                onLoadedMetadata={
                  onV2LoadedMetadata
                }
                style={
                  clipStyle(
                    activeV2Clip,
                    v2Visible
                  )
                }
                className="absolute inset-0 z-10 w-full h-full object-contain transition-opacity duration-75"
              />
            )}

          {/* T1 */}

          {activeTextClip?.kind ===
            "text" && (
            <div
              style={
                clipStyle(
                  activeTextClip
                )
              }
              className="
                absolute
                inset-0
                z-20
                flex
                items-center
                justify-center
                pointer-events-none
                px-8
              "
            >
              <div
                style={{
                  color:
                    activeTextClip
                      .textStyle
                      .color,

                  fontSize: `${
                    activeTextClip
                      .textStyle
                      .fontSize
                  }px`,

                  fontWeight:
                    activeTextClip
                      .textStyle
                      .fontWeight,

                  textAlign:
                    activeTextClip
                      .textStyle
                      .align,
                }}
                className="
                  w-full
                  whitespace-pre-wrap
                  break-words
                  leading-tight
                  drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]
                "
              >
                {
                  activeTextClip.text
                }
              </div>
            </div>
          )}

          {!activeV1Clip &&
            !activeV2Clip &&
            !activeTextClip && (
              <div className="absolute inset-0 flex items-center justify-center text-white/25 text-xs">
                Move the
                playhead over a
                clip
              </div>
            )}
        </div>
      </div>

      {/* CONTROLS */}

      <div className="h-12 shrink-0 border-t border-[#1D222B] flex items-center justify-center gap-5">
        <span className="text-xs text-white/40 tabular-nums">
          {formatTime(
            currentTime
          )}
        </span>

        <button
          onClick={
            onTogglePlay
          }
          disabled={
            !projectDuration
          }
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-30"
        >
          {isPlaying ? (
            <Pause
              size={15}
            />
          ) : (
            <Play
              size={15}
              fill="currentColor"
            />
          )}
        </button>

        <span className="text-xs text-white/40 tabular-nums">
          {formatTime(
            projectDuration
          )}
        </span>
      </div>
    </section>
  );
}