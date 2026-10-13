"use client";

import {
  Type,
} from "lucide-react";

import {
  TimelineClip,
} from "@/types/editor";

type Props = {
  clip:
    TimelineClip;

  left: number;

  width: number;

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
    side:
      | "left"
      | "right"
  ) => void;
};

export default function TextClip({
  clip,
  left,
  width,
  selected,
  locked,
  onSelect,
  onDragStart,
  onTrimStart,
}: Props) {
  if (
    clip.kind !==
    "text"
  ) {
    return null;
  }

  return (
    <div
      onMouseDown={(
        event
      ) => {
        if (locked) {
          return;
        }

        onDragStart(
          event,
          clip
        );
      }}
      onClick={(
        event
      ) => {
        event.stopPropagation();

        onSelect(
          clip
        );
      }}
      className={`
        absolute
        top-1
        bottom-1
        rounded-md
        overflow-hidden
        bg-fuchsia-500/15
        transition

        ${
          locked
            ? "cursor-default"
            : "cursor-grab active:cursor-grabbing"
        }

        ${
          selected
            ? "border-2 border-fuchsia-200 shadow-[0_0_0_1px_rgba(232,121,249,0.25)]"
            : "border border-fuchsia-500/35 hover:border-fuchsia-400/70"
        }
      `}
      style={{
        left: `${left}px`,

        width: `${Math.max(
          width,
          8
        )}px`,
      }}
    >
      <div className="absolute inset-0 flex items-center gap-1.5 px-2 pointer-events-none">
        <Type
          size={11}
          className="shrink-0 text-fuchsia-200/80"
        />

        <span className="truncate text-[10px] font-medium text-fuchsia-50/90">
          {clip.text ||
            "Text"}
        </span>
      </div>

      {!locked && (
        <>
          {/* LEFT TRIM */}

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
                  ? "bg-fuchsia-100"
                  : "hover:bg-fuchsia-300/60"
              }
            `}
          />

          {/* RIGHT TRIM */}

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
                  ? "bg-fuchsia-100"
                  : "hover:bg-fuchsia-300/60"
              }
            `}
          />
        </>
      )}
    </div>
  );
}