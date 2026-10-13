"use client";

import {
  Maximize2,
  Move,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
} from "lucide-react";

import { TimelineClip } from "@/types/editor";

type Props = {
  selectedClip: TimelineClip | null;

  locked: boolean;

  onTransformChange: (
    patch: Partial<TimelineClip["transform"]>
  ) => void;

  onResetTransform: () => void;
};

function toNumber(
  value: string,
  fallback: number
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

export default function PropertiesPanel({
  selectedClip,
  locked,
  onTransformChange,
  onResetTransform,
}: Props) {
  const transform =
    selectedClip?.transform;

  const disabled =
    !selectedClip ||
    locked;

  return (
    <aside className="w-[290px] shrink-0 border-l border-[#222630] bg-[#101319] overflow-y-auto">
      {/* TABS */}

      <div className="h-12 border-b border-[#222630] flex px-4 gap-5">
        <button className="text-xs text-violet-300 border-b-2 border-violet-400">
          Video
        </button>

        <button className="text-xs text-white/40">
          Animation
        </button>

        <button className="text-xs text-white/40">
          Adjust
        </button>
      </div>

      {/* EMPTY STATE */}

      {!selectedClip ? (
        <div className="h-[240px] flex flex-col items-center justify-center px-6 text-center">
          <Move
            size={22}
            className="text-white/15 mb-3"
          />

          <p className="text-xs text-white/45">
            Select a clip to edit its properties
          </p>

          <p className="text-[10px] text-white/20 mt-1">
            Position, scale, rotation and opacity will appear here
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-5">
          {/* SELECTED CLIP */}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/35">
                Selected clip
              </p>

              <p className="text-xs text-white/80 mt-1 max-w-[170px] truncate">
                {selectedClip.name}
              </p>
            </div>

            <button
              onClick={onResetTransform}
              disabled={disabled}
              title="Reset transform"
              className="h-8 px-2.5 rounded-lg border border-[#2A3039] text-[10px] text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 flex items-center gap-1.5"
            >
              <RotateCcw
                size={12}
              />

              Reset
            </button>
          </div>

          {/* POSITION */}

          <div className="border-t border-[#222630] pt-4">
            <div className="flex items-center gap-2 text-xs mb-4">
              <Move size={14} />

              Transform
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="text-[9px] text-white/35 block mb-1.5">
                  Position X
                </span>

                <input
                  type="number"
                  value={
                    transform?.x ??
                    0
                  }
                  disabled={
                    disabled
                  }
                  onChange={(
                    event
                  ) =>
                    onTransformChange(
                      {
                        x: toNumber(
                          event
                            .target
                            .value,

                          transform?.x ??
                            0
                        ),
                      }
                    )
                  }
                  className="w-full bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs outline-none focus:border-violet-500 disabled:opacity-40"
                />
              </label>

              <label>
                <span className="text-[9px] text-white/35 block mb-1.5">
                  Position Y
                </span>

                <input
                  type="number"
                  value={
                    transform?.y ??
                    0
                  }
                  disabled={
                    disabled
                  }
                  onChange={(
                    event
                  ) =>
                    onTransformChange(
                      {
                        y: toNumber(
                          event
                            .target
                            .value,

                          transform?.y ??
                            0
                        ),
                      }
                    )
                  }
                  className="w-full bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs outline-none focus:border-violet-500 disabled:opacity-40"
                />
              </label>
            </div>
          </div>

          {/* SCALE */}

          <div>
            <div className="text-[10px] text-white/40 mb-2 flex gap-2">
              <Maximize2
                size={12}
              />

              Scale
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="10"
                max="300"
                step="1"
                value={
                  transform?.scale ??
                  100
                }
                disabled={
                  disabled
                }
                onChange={(
                  event
                ) =>
                  onTransformChange(
                    {
                      scale:
                        toNumber(
                          event
                            .target
                            .value,

                          transform?.scale ??
                            100
                        ),
                    }
                  )
                }
                className="flex-1 accent-violet-500"
              />

              <input
                type="number"
                min="10"
                max="300"
                value={
                  transform?.scale ??
                  100
                }
                disabled={
                  disabled
                }
                onChange={(
                  event
                ) =>
                  onTransformChange(
                    {
                      scale:
                        Math.max(
                          10,

                          Math.min(
                            300,

                            toNumber(
                              event
                                .target
                                .value,

                              transform?.scale ??
                                100
                            )
                          )
                        ),
                    }
                  )
                }
                className="w-[68px] bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs outline-none focus:border-violet-500 disabled:opacity-40"
              />
            </div>
          </div>

          {/* ROTATION */}

          <div>
            <div className="text-[10px] text-white/40 mb-2 flex gap-2">
              <RotateCw
                size={12}
              />

              Rotation
            </div>

            <input
              type="number"
              value={
                transform?.rotation ??
                0
              }
              disabled={
                disabled
              }
              onChange={(
                event
              ) =>
                onTransformChange(
                  {
                    rotation:
                      toNumber(
                        event
                          .target
                          .value,

                        transform?.rotation ??
                          0
                      ),
                  }
                )
              }
              className="w-full bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs outline-none focus:border-violet-500 disabled:opacity-40"
            />
          </div>

          {/* OPACITY */}

          <div className="border-t border-[#222630] pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2 text-xs">
                <SlidersHorizontal
                  size={14}
                />

                Opacity
              </div>

              <span className="text-[10px] text-white/40 tabular-nums">
                {Math.round(
                  transform?.opacity ??
                    100
                )}
                %
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={
                transform?.opacity ??
                100
              }
              disabled={
                disabled
              }
              onChange={(
                event
              ) =>
                onTransformChange(
                  {
                    opacity:
                      toNumber(
                        event
                          .target
                          .value,

                        transform?.opacity ??
                          100
                      ),
                  }
                )
              }
              className="w-full accent-violet-500"
            />
          </div>

          {/* LOCK MESSAGE */}

          {locked && (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-[10px] text-violet-200/70">
              Timeline is locked. Unlock it to edit clip properties.
            </div>
          )}
        </div>
      )}
    </aside>
  );
}