"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Maximize2,
  Move,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Type,
} from "lucide-react";

import {
  TimelineClip,
} from "@/types/editor";

type TextPatch = {
  text?: string;

  fontSize?: number;

  color?: string;

  align?:
    | "left"
    | "center"
    | "right";

  fontWeight?: number;
};

type Props = {
  selectedClip:
    TimelineClip | null;

  locked: boolean;

  onTransformChange: (
    patch:
      Partial<
        TimelineClip["transform"]
      >
  ) => void;

  onResetTransform:
    () => void;

  onTextChange: (
    patch:
      TextPatch
  ) => void;

  onBringForward:
    () => void;

  onSendBackward:
    () => void;
};

function toNumber(
  value: string,
  fallback: number
) {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}

export default function PropertiesPanel({
  selectedClip,
  locked,
  onTransformChange,
  onResetTransform,
  onTextChange,
  onBringForward,
  onSendBackward,
}: Props) {
  const transform =
    selectedClip?.transform;

  const disabled =
    !selectedClip ||
    locked;

  const isText =
    selectedClip?.kind ===
    "text";

  const canReorder =
    !!selectedClip &&
    !(
      selectedClip.kind ===
        "video" &&
      selectedClip.track ===
        "V1"
    );

  return (
    <aside
      className="
        w-[290px]
        shrink-0
        border-l
        border-[#222630]
        bg-[#101319]
        overflow-y-auto
      "
    >
      {/* TABS */}

      <div
        className="
          h-12
          border-b
          border-[#222630]
          flex
          px-4
          gap-5
        "
      >
        <button
          className="
            text-xs
            text-violet-300
            border-b-2
            border-violet-400
          "
        >
          {isText
            ? "Text"
            : "Video"}
        </button>

        <button
          className="
            text-xs
            text-white/40
          "
        >
          Animation
        </button>

        <button
          className="
            text-xs
            text-white/40
          "
        >
          Adjust
        </button>
      </div>

      {!selectedClip ? (
        <div
          className="
            h-[240px]
            flex
            flex-col
            items-center
            justify-center
            px-6
            text-center
          "
        >
          <Move
            size={22}
            className="
              text-white/15
              mb-3
            "
          />

          <p
            className="
              text-xs
              text-white/45
            "
          >
            Select a clip to
            edit its properties
          </p>

          <p
            className="
              text-[10px]
              text-white/20
              mt-1
            "
          >
            Position, scale,
            rotation and opacity
            will appear here
          </p>
        </div>
      ) : (
        <div
          className="
            p-4
            space-y-5
          "
        >
          {/* HEADER */}

          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <div
              className="
                min-w-0
              "
            >
              <p
                className="
                  text-[10px]
                  text-white/35
                "
              >
                Selected clip
              </p>

              <p
                className="
                  text-xs
                  text-white/80
                  mt-1
                  max-w-[170px]
                  truncate
                "
              >
                {
                  selectedClip.name
                }
              </p>
            </div>

            <button
              onClick={
                onResetTransform
              }
              disabled={
                disabled
              }
              title="Reset transform"
              className="
                h-8
                px-2.5
                rounded-lg
                border
                border-[#2A3039]
                text-[10px]
                text-white/50
                hover:text-white
                hover:bg-white/5
                disabled:opacity-30
                flex
                items-center
                gap-1.5
              "
            >
              <RotateCcw
                size={12}
              />

              Reset
            </button>
          </div>

          {/* LAYER ORDER */}

          {canReorder && (
            <div
              className="
                border-t
                border-[#222630]
                pt-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-2
                "
              >
                <p
                  className="
                    text-[10px]
                    text-white/35
                  "
                >
                  Layer order
                </p>

                <span
                  className="
                    text-[9px]
                    text-white/20
                  "
                >
                  Layer{" "}
                  {
                    selectedClip.zIndex
                  }
                </span>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-2
                "
              >
                <button
                  onClick={
                    onBringForward
                  }
                  disabled={
                    disabled
                  }
                  className="
                    h-9
                    rounded-lg
                    border
                    border-[#282D36]
                    bg-[#0B0E13]
                    text-[10px]
                    text-white/55
                    hover:text-white
                    hover:border-violet-500/50
                    hover:bg-violet-500/5
                    disabled:opacity-30
                    flex
                    items-center
                    justify-center
                    gap-1.5
                  "
                >
                  <ArrowUp
                    size={12}
                  />

                  Forward
                </button>

                <button
                  onClick={
                    onSendBackward
                  }
                  disabled={
                    disabled
                  }
                  className="
                    h-9
                    rounded-lg
                    border
                    border-[#282D36]
                    bg-[#0B0E13]
                    text-[10px]
                    text-white/55
                    hover:text-white
                    hover:border-violet-500/50
                    hover:bg-violet-500/5
                    disabled:opacity-30
                    flex
                    items-center
                    justify-center
                    gap-1.5
                  "
                >
                  <ArrowDown
                    size={12}
                  />

                  Backward
                </button>
              </div>
            </div>
          )}

          {/* TEXT CONTROLS */}

          {selectedClip.kind ===
            "text" && (
            <div
              className="
                border-t
                border-[#222630]
                pt-4
                space-y-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                "
              >
                <Type
                  size={14}
                />

                Text
              </div>

              <textarea
                value={
                  selectedClip.text
                }
                disabled={
                  disabled
                }
                onChange={(
                  event
                ) =>
                  onTextChange(
                    {
                      text:
                        event
                          .target
                          .value,
                    }
                  )
                }
                rows={3}
                placeholder="Type your text"
                className="
                  w-full
                  resize-none
                  bg-[#0B0E13]
                  border
                  border-[#282D36]
                  rounded-lg
                  p-2.5
                  text-xs
                  outline-none
                  focus:border-violet-500
                  disabled:opacity-40
                "
              />

              <div
                className="
                  grid
                  grid-cols-2
                  gap-2
                "
              >
                {/* FONT SIZE */}

                <label>
                  <span
                    className="
                      text-[9px]
                      text-white/35
                      block
                      mb-1.5
                    "
                  >
                    Font size
                  </span>

                  <input
                    type="number"
                    min="8"
                    max="240"
                    value={
                      selectedClip
                        .textStyle
                        .fontSize
                    }
                    disabled={
                      disabled
                    }
                    onChange={(
                      event
                    ) =>
                      onTextChange(
                        {
                          fontSize:
                            Math.max(
                              8,

                              Math.min(
                                240,

                                toNumber(
                                  event
                                    .target
                                    .value,

                                  selectedClip
                                    .textStyle
                                    .fontSize
                                )
                              )
                            ),
                        }
                      )
                    }
                    className="
                      w-full
                      bg-[#0B0E13]
                      border
                      border-[#282D36]
                      rounded-lg
                      p-2
                      text-xs
                      outline-none
                      focus:border-violet-500
                      disabled:opacity-40
                    "
                  />
                </label>

                {/* COLOR */}

                <label>
                  <span
                    className="
                      text-[9px]
                      text-white/35
                      block
                      mb-1.5
                    "
                  >
                    Color
                  </span>

                  <div
                    className="
                      h-[34px]
                      rounded-lg
                      border
                      border-[#282D36]
                      bg-[#0B0E13]
                      p-1
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <input
                      type="color"
                      value={
                        selectedClip
                          .textStyle
                          .color
                      }
                      disabled={
                        disabled
                      }
                      onChange={(
                        event
                      ) =>
                        onTextChange(
                          {
                            color:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="
                        w-7
                        h-6
                        bg-transparent
                        border-0
                        cursor-pointer
                      "
                    />

                    <span
                      className="
                        text-[9px]
                        text-white/45
                        uppercase
                        truncate
                      "
                    >
                      {
                        selectedClip
                          .textStyle
                          .color
                      }
                    </span>
                  </div>
                </label>
              </div>

              {/* ALIGNMENT */}

              <div>
                <span
                  className="
                    text-[9px]
                    text-white/35
                    block
                    mb-1.5
                  "
                >
                  Alignment
                </span>

                <div
                  className="
                    grid
                    grid-cols-3
                    gap-1.5
                  "
                >
                  {(
                    [
                      [
                        "left",
                        AlignLeft,
                      ],

                      [
                        "center",
                        AlignCenter,
                      ],

                      [
                        "right",
                        AlignRight,
                      ],
                    ] as const
                  ).map(
                    ([
                      align,
                      Icon,
                    ]) => (
                      <button
                        key={
                          align
                        }
                        onClick={() =>
                          onTextChange(
                            {
                              align,
                            }
                          )
                        }
                        disabled={
                          disabled
                        }
                        className={`h-8 rounded-lg border flex items-center justify-center transition disabled:opacity-40 ${
                          selectedClip
                            .textStyle
                            .align ===
                          align
                            ? "border-violet-400 bg-violet-500/15 text-violet-200"
                            : "border-[#282D36] bg-[#0B0E13] text-white/40 hover:text-white"
                        }`}
                      >
                        <Icon
                          size={13}
                        />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* WEIGHT */}

              <label>
                <span
                  className="
                    text-[9px]
                    text-white/35
                    block
                    mb-1.5
                  "
                >
                  Font weight
                </span>

                <select
                  value={
                    selectedClip
                      .textStyle
                      .fontWeight
                  }
                  disabled={
                    disabled
                  }
                  onChange={(
                    event
                  ) =>
                    onTextChange(
                      {
                        fontWeight:
                          Number(
                            event
                              .target
                              .value
                          ),
                      }
                    )
                  }
                  className="
                    w-full
                    bg-[#0B0E13]
                    border
                    border-[#282D36]
                    rounded-lg
                    p-2
                    text-xs
                    outline-none
                    focus:border-violet-500
                    disabled:opacity-40
                  "
                >
                  <option value="400">
                    Regular
                  </option>

                  <option value="500">
                    Medium
                  </option>

                  <option value="600">
                    Semi Bold
                  </option>

                  <option value="700">
                    Bold
                  </option>

                  <option value="800">
                    Extra Bold
                  </option>
                </select>
              </label>
            </div>
          )}

          {/* TRANSFORM */}

          <div
            className="
              border-t
              border-[#222630]
              pt-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                mb-4
              "
            >
              <Move
                size={14}
              />

              Transform
            </div>

            <div
              className="
                grid
                grid-cols-2
                gap-2
              "
            >
              <label>
                <span
                  className="
                    text-[9px]
                    text-white/35
                    block
                    mb-1.5
                  "
                >
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
                  className="
                    w-full
                    bg-[#0B0E13]
                    border
                    border-[#282D36]
                    rounded-lg
                    p-2
                    text-xs
                    outline-none
                    focus:border-violet-500
                    disabled:opacity-40
                  "
                />
              </label>

              <label>
                <span
                  className="
                    text-[9px]
                    text-white/35
                    block
                    mb-1.5
                  "
                >
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
                  className="
                    w-full
                    bg-[#0B0E13]
                    border
                    border-[#282D36]
                    rounded-lg
                    p-2
                    text-xs
                    outline-none
                    focus:border-violet-500
                    disabled:opacity-40
                  "
                />
              </label>
            </div>
          </div>

          {/* SCALE */}

          <div>
            <div
              className="
                text-[10px]
                text-white/40
                mb-2
                flex
                gap-2
              "
            >
              <Maximize2
                size={12}
              />

              Scale
            </div>

            <div
              className="
                flex
                gap-2
                items-center
              "
            >
              <input
                type="range"
                min="10"
                max="400"
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
                className="
                  flex-1
                  accent-violet-500
                "
              />

              <input
                type="number"
                min="10"
                max="400"
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
                            400,

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
                className="
                  w-[68px]
                  bg-[#0B0E13]
                  border
                  border-[#282D36]
                  rounded-lg
                  p-2
                  text-xs
                  outline-none
                  focus:border-violet-500
                  disabled:opacity-40
                "
              />
            </div>
          </div>

          {/* ROTATION */}

          <div>
            <div
              className="
                text-[10px]
                text-white/40
                mb-2
                flex
                gap-2
              "
            >
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
              className="
                w-full
                bg-[#0B0E13]
                border
                border-[#282D36]
                rounded-lg
                p-2
                text-xs
                outline-none
                focus:border-violet-500
                disabled:opacity-40
              "
            />
          </div>

          {/* OPACITY */}

          <div
            className="
              border-t
              border-[#222630]
              pt-5
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                mb-3
              "
            >
              <div
                className="
                  flex
                  gap-2
                  text-xs
                "
              >
                <SlidersHorizontal
                  size={14}
                />

                Opacity
              </div>

              <span
                className="
                  text-[10px]
                  text-white/40
                  tabular-nums
                "
              >
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
              className="
                w-full
                accent-violet-500
              "
            />
          </div>

          {locked && (
            <div
              className="
                rounded-lg
                border
                border-violet-500/20
                bg-violet-500/5
                p-3
                text-[10px]
                text-violet-200/70
              "
            >
              Timeline is locked.
              Unlock it to edit
              clip properties.
            </div>
          )}
        </div>
      )}
    </aside>
  );
}