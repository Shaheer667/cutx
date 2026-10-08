"use client";

import {
  GripHorizontal,
} from "lucide-react";

import {
  TimelineClip,
} from "@/types/editor";

import TimelineToolbar from "./TimelineToolbar";
import TimelineRuler from "./TimelineRuler";

import VideoTrack from "./VideoTrack";
import AudioTrack from "./AudioTrack";

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

  locked: boolean;

  v1Height: number;
  v2Height: number;
  audioHeight: number;

  getFrames: (
    clip: TimelineClip,
    width: number
  ) => string[];

  getWaveform: (
    clip: TimelineClip,
    width: number
  ) => number[];

  onSelectClip: (
    clip: TimelineClip
  ) => void;

  onTimelineClick: (
    event: React.MouseEvent<HTMLDivElement>
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

  onTrackResize: (
    event: React.MouseEvent,
    track:
      | "V1"
      | "V2"
      | "A1"
  ) => void;

  onSplit: () => void;

  onDelete: () => void;

  onRippleDelete: () => void;

  onZoomIn: () => void;

  onZoomOut: () => void;

  onToggleV1: () => void;

  onToggleV2: () => void;

  onToggleAudio: () => void;

  onToggleLock: () => void;
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
  locked,
  v1Height,
  v2Height,
  audioHeight,
  getFrames,
  getWaveform,
  onSelectClip,
  onTimelineClick,
  onDragStart,
  onTrimStart,
  onTrackResize,
  onSplit,
  onDelete,
  onRippleDelete,
  onZoomIn,
  onZoomOut,
  onToggleV1,
  onToggleV2,
  onToggleAudio,
  onToggleLock,
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

  return (
    <section className="h-[290px] min-h-[290px] shrink-0 border-t border-[#222630] bg-[#0D1015] overflow-hidden flex flex-col">

      <TimelineToolbar
        selectedClipId={
          selectedClipId
        }
        currentTime={
          currentTime
        }
        zoom={zoom}
        locked={locked}
        onSplit={onSplit}
        onDelete={onDelete}
        onRippleDelete={
          onRippleDelete
        }
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />

      <TimelineRuler
        projectDuration={
          projectDuration
        }
        pixelsPerSecond={
          pixelsPerSecond
        }
      />

      <div className="flex-1 min-h-0 overflow-auto">

        <div
          className="relative min-h-full"
          style={{
            width: `${
              timelineWidth + 88
            }px`,
          }}
        >
          {/* PLAYHEAD */}

          <div
            className="absolute top-0 bottom-0 z-50 pointer-events-none"
            style={{
              left: `${
                88 + playhead
              }px`,
            }}
          >
            <div className="w-px h-full bg-violet-400" />

            <div className="absolute -top-[3px] -left-[4px] w-2.5 h-2.5 bg-violet-400 rotate-45 rounded-sm" />
          </div>

          {/* V2 */}

          <VideoTrack
            track="V2"
            clips={clips}
            trackHeight={
              v2Height
            }
            pixelsPerSecond={
              pixelsPerSecond
            }
            selectedClipId={
              selectedClipId
            }
            visible={
              v2Visible
            }
            locked={locked}
            getFrames={
              getFrames
            }
            onToggleVisibility={
              onToggleV2
            }
            onToggleLock={
              onToggleLock
            }
            onTimelineClick={
              onTimelineClick
            }
            onSelectClip={
              onSelectClip
            }
            onDragStart={
              onDragStart
            }
            onTrimStart={
              onTrimStart
            }
          />

          {/* V2 RESIZER */}

          <TrackResizer
            onMouseDown={(
              event
            ) =>
              onTrackResize(
                event,
                "V2"
              )
            }
          />

          {/* V1 */}

          <VideoTrack
            track="V1"
            clips={clips}
            trackHeight={
              v1Height
            }
            pixelsPerSecond={
              pixelsPerSecond
            }
            selectedClipId={
              selectedClipId
            }
            visible={
              v1Visible
            }
            locked={locked}
            getFrames={
              getFrames
            }
            onToggleVisibility={
              onToggleV1
            }
            onToggleLock={
              onToggleLock
            }
            onTimelineClick={
              onTimelineClick
            }
            onSelectClip={
              onSelectClip
            }
            onDragStart={
              onDragStart
            }
            onTrimStart={
              onTrimStart
            }
          />

          {/* V1 RESIZER */}

          <TrackResizer
            onMouseDown={(
              event
            ) =>
              onTrackResize(
                event,
                "V1"
              )
            }
          />

          {/* AUDIO */}

          <AudioTrack
            clips={clips}
            trackHeight={
              audioHeight
            }
            pixelsPerSecond={
              pixelsPerSecond
            }
            selectedClipId={
              selectedClipId
            }
            muted={
              audioMuted
            }
            locked={
              locked
            }
            getWaveform={
              getWaveform
            }
            onToggleMute={
              onToggleAudio
            }
            onToggleLock={
              onToggleLock
            }
            onSelectClip={
              onSelectClip
            }
            onDragStart={
              onDragStart
            }
            onTrimStart={
              onTrimStart
            }
          />

          {/* AUDIO RESIZER */}

          <TrackResizer
            onMouseDown={(
              event
            ) =>
              onTrackResize(
                event,
                "A1"
              )
            }
          />

        </div>

      </div>

    </section>
  );
}

function TrackResizer({
  onMouseDown,
}: {
  onMouseDown:
    (
      event: React.MouseEvent
    ) => void;
}) {
  return (
    <div className="h-[6px] flex bg-[#11151B]">

      <div className="w-[88px] shrink-0 border-r border-[#222630] bg-[#101319]" />

      <div
        onMouseDown={
          onMouseDown
        }
        className="flex-1 cursor-row-resize hover:bg-violet-500/15 transition flex items-center justify-center"
      >
        <GripHorizontal
          size={12}
          className="text-white/15"
        />
      </div>

    </div>
  );
}