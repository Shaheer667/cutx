import {
  Eye,
  EyeOff,
  Scissors,
  Trash2,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  TimelineClip,
} from "@/types/editor";

import {
  formatTime,
} from "@/utils/time";

type Props = {
  clips: TimelineClip[];

  selectedClipId:
    string | null;

  currentTime: number;

  projectDuration: number;

  pixelsPerSecond: number;

  zoom: number;

  v1Visible: boolean;
  v2Visible: boolean;

  audioMuted: boolean;

  setSelectedClipId:
    (id: string | null) => void;

  onSplit: () => void;

  onDelete: () => void;

  onZoomIn: () => void;

  onZoomOut: () => void;

  onToggleV1: () => void;

  onToggleV2: () => void;

  onToggleAudio: () => void;
};

export default function Timeline({
  clips,
  selectedClipId,
  currentTime,
  projectDuration,
  pixelsPerSecond,
  zoom,
  v1Visible,
  v2Visible,
  audioMuted,
  setSelectedClipId,
  onSplit,
  onDelete,
  onZoomIn,
  onZoomOut,
  onToggleV1,
  onToggleV2,
  onToggleAudio,
}: Props) {
  const timelineWidth =
    Math.max(
      projectDuration *
        pixelsPerSecond,
      900
    );

  const playhead =
    currentTime *
    pixelsPerSecond;

  const renderTrack = (
    track: "V1" | "V2"
  ) =>
    clips
      .filter(
        (clip) =>
          clip.track === track
      )
      .map((clip) => {
        const left =
          clip.timelineStart *
          pixelsPerSecond;

        const width =
          clip.duration *
          pixelsPerSecond;

        const selected =
          clip.id ===
          selectedClipId;

        return (
          <button
            key={clip.id}
            onClick={() =>
              setSelectedClipId(
                clip.id
              )
            }
            className={`absolute top-2 h-10 rounded-md px-2 text-[9px] truncate text-left ${
              selected
                ? "border-2 border-violet-200 bg-violet-500/40"
                : "border border-violet-500/30 bg-violet-500/20"
            }`}
            style={{
              left,
              width:
                Math.max(
                  width,
                  4
                ),
            }}
          >
            {clip.name}
          </button>
        );
      });

  return (
    <section className="h-[300px] min-h-[300px] shrink-0 flex flex-col border-t border-[#222630] bg-[#0D1015]">

      <div className="h-11 shrink-0 border-b border-[#222630] px-4 flex items-center gap-2">

        <button
          onClick={onSplit}
          className="h-8 px-3 flex gap-2 items-center text-xs rounded hover:bg-white/5"
        >
          <Scissors size={14} />
          Split
        </button>

        <button
          onClick={onDelete}
          disabled={!selectedClipId}
          className="h-8 px-3 flex gap-2 items-center text-xs rounded hover:bg-white/5 disabled:opacity-30"
        >
          <Trash2 size={14} />
          Delete
        </button>

        <span className="ml-4 text-xs text-white/40">
          {formatTime(
            currentTime
          )}
        </span>

        <div className="ml-auto flex items-center gap-2">

          <button onClick={onZoomOut}>
            <ZoomOut size={14} />
          </button>

          <span className="w-10 text-center text-[10px]">
            {zoom}%
          </span>

          <button onClick={onZoomIn}>
            <ZoomIn size={14} />
          </button>

        </div>

      </div>

      <div className="flex-1 overflow-auto">

        <div
          className="relative"
          style={{
            width:
              timelineWidth +
              88,
          }}
        >

          <div
            className="absolute top-0 bottom-0 z-40 pointer-events-none"
            style={{
              left:
                88 + playhead,
            }}
          >
            <div className="w-px h-full bg-violet-400" />
          </div>

          {/* V2 */}

          <div className="h-16 flex border-b border-[#171B21]">

            <div className="w-[88px] shrink-0 border-r border-[#222630] px-3 flex items-center">

              <span className="text-[10px]">
                V2
              </span>

              <button
                onClick={onToggleV2}
                className="ml-auto"
              >
                {v2Visible ? (
                  <Eye size={12} />
                ) : (
                  <EyeOff size={12} />
                )}
              </button>

            </div>

            <div className="relative flex-1 bg-[#0B0E13]">
              {renderTrack("V2")}
            </div>

          </div>

          {/* V1 */}

          <div className="h-16 flex border-b border-[#171B21]">

            <div className="w-[88px] shrink-0 border-r border-[#222630] px-3 flex items-center">

              <span className="text-[10px]">
                V1
              </span>

              <button
                onClick={onToggleV1}
                className="ml-auto"
              >
                {v1Visible ? (
                  <Eye size={12} />
                ) : (
                  <EyeOff size={12} />
                )}
              </button>

            </div>

            <div className="relative flex-1 bg-[#0B0E13]">
              {renderTrack("V1")}
            </div>

          </div>

          {/* A1 */}

          <div className="h-14 flex">

            <div className="w-[88px] shrink-0 border-r border-[#222630] px-3 flex items-center">

              <span className="text-[10px]">
                A1
              </span>

              <button
                onClick={onToggleAudio}
                className="ml-auto"
              >
                {audioMuted ? (
                  <VolumeX size={12} />
                ) : (
                  <Volume2 size={12} />
                )}
              </button>

            </div>

            <div className="flex-1 bg-[#0B0E13]" />

          </div>

        </div>

      </div>

    </section>
  );
}