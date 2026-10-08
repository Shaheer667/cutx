"use client";

import { TimelineClip } from "@/types/editor";

type Props = {
  clip: TimelineClip;

  left: number;
  width: number;

  frames: string[];

  selected: boolean;
  locked: boolean;

  onSelect: (
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

export default function VideoClip({
  clip,
  left,
  width,
  frames,
  selected,
  locked,
  onSelect,
  onDragStart,
  onTrimStart,
}: Props) {
  return (
    <div
      onMouseDown={(event) => {
        if (locked) return;

        onDragStart(
          event,
          clip
        );
      }}
      onClick={(event) => {
        event.stopPropagation();

        onSelect(clip);
      }}
      className={`
        absolute
        top-1
        bottom-1
        rounded-md
        overflow-hidden
        transition
        ${
          locked
            ? "cursor-default"
            : "cursor-grab active:cursor-grabbing"
        }
        ${
          selected
            ? "border-2 border-violet-200 shadow-[0_0_0_1px_rgba(167,139,250,0.4)]"
            : "border border-violet-500/35 hover:border-violet-400/60"
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
      {/* FRAME STRIP */}

      <div className="absolute inset-0 flex bg-[#17111F]">
        {frames.length > 0 ? (
          frames.map(
            (frame, index) => (
              <img
                key={index}
                src={frame}
                alt=""
                draggable={false}
                className="
                  h-full
                  flex-1
                  min-w-0
                  object-cover
                  opacity-80
                  pointer-events-none
                "
              />
            )
          )
        ) : (
          <div className="w-full h-full bg-violet-500/15" />
        )}
      </div>

      {/* COLOR TINT */}

      <div className="absolute inset-0 bg-violet-600/10 pointer-events-none" />

      {/* NAME */}

      <span
        className="
          absolute
          left-2
          top-1.5
          z-10
          max-w-[75%]
          truncate
          rounded
          bg-black/65
          px-1.5
          py-[2px]
          text-[9px]
          text-white
          pointer-events-none
        "
      >
        {clip.name}
      </span>

      {/* SELECTED TOP LINE */}

      {selected && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-violet-200 pointer-events-none" />
      )}

      {/* LEFT TRIM */}

      {!locked && (
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
            w-[7px]
            cursor-ew-resize
            ${
              selected
                ? "bg-violet-100"
                : "bg-transparent hover:bg-violet-300/60"
            }
          `}
        />
      )}

      {/* RIGHT TRIM */}

      {!locked && (
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
            w-[7px]
            cursor-ew-resize
            ${
              selected
                ? "bg-violet-100"
                : "bg-transparent hover:bg-violet-300/60"
            }
          `}
        />
      )}
    </div>
  );
}