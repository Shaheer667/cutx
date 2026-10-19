"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Crop,
  Maximize2,
  Move,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Type,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  ClipAudioSettings,
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

  locked:
    boolean;

  cropMode:
    boolean;

  onStartCrop:
    () => void;

  onResetCrop:
    () => void;

  onTransformChange: (
    patch:
      Partial<
        TimelineClip["transform"]
      >
  ) => void;

  onResetTransform:
    () => void;

  onAudioChange: (
    patch:
      Partial<
        ClipAudioSettings
      >
  ) => void;

  onResetAudio:
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
  value:
    string,

  fallback:
    number
) {
  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}

function clamp(
  value:
    number,

  min:
    number,

  max:
    number
) {
  return Math.max(
    min,

    Math.min(
      max,
      value
    )
  );
}

export default function PropertiesPanel({
  selectedClip,
  locked,
  cropMode,
  onStartCrop,
  onResetCrop,
  onTransformChange,
  onResetTransform,
  onAudioChange,
  onResetAudio,
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

  const isVideo =
    selectedClip?.kind ===
    "video";

  const fitMode =
    transform?.fitMode ??
    "fit";

  const flipX =
    transform?.flipX ??
    false;

  const flipY =
    transform?.flipY ??
    false;

  const cropTop =
    transform?.cropTop ??
    0;

  const cropRight =
    transform?.cropRight ??
    0;

  const cropBottom =
    transform?.cropBottom ??
    0;

  const cropLeft =
    transform?.cropLeft ??
    0;

  const hasCrop =
    cropTop >
      0 ||
    cropRight >
      0 ||
    cropBottom >
      0 ||
    cropLeft >
      0;

  const canReorder =
    !!selectedClip &&
    !(
      selectedClip.kind ===
        "video" &&
      selectedClip.track ===
        "V1"
    );

  const audio =
    selectedClip?.kind ===
    "video"
      ? selectedClip.audio ?? {
          volume:
            100,

          muted:
            false,

          fadeIn:
            0,

          fadeOut:
            0,
        }
      : null;

  const maxFade =
    selectedClip?.kind ===
    "video"
      ? Math.max(
          0,

          selectedClip.duration
        )
      : 0;

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
                disabled ||
                cropMode
              }
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

          {/* =================================
              VIDEO FRAME
          ================================= */}

          {isVideo && (
            <div
              className="
                border-t
                border-[#222630]
                pt-4
                space-y-4
              "
            >
              <div>
                <p
                  className="
                    text-[10px]
                    text-white/40
                    mb-2
                  "
                >
                  Frame
                </p>

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-2
                  "
                >
                  <button
                    onClick={() =>
                      onTransformChange(
                        {
                          fitMode:
                            "fit",
                        }
                      )
                    }
                    disabled={
                      disabled ||
                      cropMode
                    }
                    className={`
                      h-9 rounded-lg border text-[10px] transition disabled:opacity-30
                      ${
                        fitMode ===
                        "fit"
                          ? "border-violet-400 bg-violet-500/15 text-violet-200"
                          : "border-[#282D36] bg-[#0B0E13] text-white/45 hover:text-white"
                      }
                    `}
                  >
                    Fit
                  </button>

                  <button
                    onClick={() =>
                      onTransformChange(
                        {
                          fitMode:
                            "fill",
                        }
                      )
                    }
                    disabled={
                      disabled ||
                      cropMode
                    }
                    className={`
                      h-9 rounded-lg border text-[10px] transition disabled:opacity-30
                      ${
                        fitMode ===
                        "fill"
                          ? "border-violet-400 bg-violet-500/15 text-violet-200"
                          : "border-[#282D36] bg-[#0B0E13] text-white/45 hover:text-white"
                      }
                    `}
                  >
                    Fill
                  </button>
                </div>
              </div>

              {/* CROP */}

              <div>
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
                      text-white/40
                    "
                  >
                    Crop
                  </p>

                  {hasCrop && (
                    <span
                      className="
                        text-[9px]
                        text-violet-300
                      "
                    >
                      Active
                    </span>
                  )}
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
                      onStartCrop
                    }
                    disabled={
                      disabled ||
                      cropMode
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
                      disabled:opacity-30
                      flex
                      items-center
                      justify-center
                      gap-1.5
                    "
                  >
                    <Crop
                      size={12}
                    />

                    {hasCrop
                      ? "Edit Crop"
                      : "Crop"}
                  </button>

                  <button
                    onClick={
                      onResetCrop
                    }
                    disabled={
                      disabled ||
                      !hasCrop ||
                      cropMode
                    }
                    className="
                      h-9
                      rounded-lg
                      border
                      border-[#282D36]
                      bg-[#0B0E13]
                      text-[10px]
                      text-white/45
                      hover:text-white
                      disabled:opacity-25
                    "
                  >
                    Reset Crop
                  </button>
                </div>
              </div>

              {/* FLIP */}

              <div>
                <p
                  className="
                    text-[10px]
                    text-white/40
                    mb-2
                  "
                >
                  Flip
                </p>

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-2
                  "
                >
                  <button
                    onClick={() =>
                      onTransformChange(
                        {
                          flipX:
                            !flipX,
                        }
                      )
                    }
                    disabled={
                      disabled ||
                      cropMode
                    }
                    className={`
                      h-9 rounded-lg border text-[10px] disabled:opacity-30
                      ${
                        flipX
                          ? "border-violet-400 bg-violet-500/15 text-violet-200"
                          : "border-[#282D36] bg-[#0B0E13] text-white/45"
                      }
                    `}
                  >
                    Flip H
                  </button>

                  <button
                    onClick={() =>
                      onTransformChange(
                        {
                          flipY:
                            !flipY,
                        }
                      )
                    }
                    disabled={
                      disabled ||
                      cropMode
                    }
                    className={`
                      h-9 rounded-lg border text-[10px] disabled:opacity-30
                      ${
                        flipY
                          ? "border-violet-400 bg-violet-500/15 text-violet-200"
                          : "border-[#282D36] bg-[#0B0E13] text-white/45"
                      }
                    `}
                  >
                    Flip V
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================
              AUDIO
          ================================= */}

          {isVideo &&
            audio && (
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
                  justify-between
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
                  <Volume2
                    size={14}
                  />

                  Audio
                </div>

                <button
                  onClick={
                    onResetAudio
                  }
                  disabled={
                    disabled
                  }
                  className="
                    text-[9px]
                    text-white/30
                    hover:text-white
                    disabled:opacity-30
                  "
                >
                  Reset
                </button>
              </div>

              {/* MUTE */}

              <button
                onClick={() =>
                  onAudioChange(
                    {
                      muted:
                        !audio.muted,
                    }
                  )
                }
                disabled={
                  disabled
                }
                className={`
                  w-full
                  h-9
                  rounded-lg
                  border
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-[10px]
                  transition
                  disabled:opacity-30

                  ${
                    audio.muted
                      ? "border-red-400/40 bg-red-500/10 text-red-200"
                      : "border-[#282D36] bg-[#0B0E13] text-white/50 hover:text-white"
                  }
                `}
              >
                {audio.muted ? (
                  <VolumeX
                    size={13}
                  />
                ) : (
                  <Volume2
                    size={13}
                  />
                )}

                {audio.muted
                  ? "Clip Muted"
                  : "Mute Clip"}
              </button>

              {/* VOLUME */}

              <div>
                <div
                  className="
                    flex
                    justify-between
                    mb-2
                  "
                >
                  <span
                    className="
                      text-[9px]
                      text-white/35
                    "
                  >
                    Volume
                  </span>

                  <span
                    className="
                      text-[9px]
                      text-white/50
                    "
                  >
                    {Math.round(
                      audio.volume
                    )}
                    %
                  </span>
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="1"
                    value={
                      audio.volume
                    }
                    disabled={
                      disabled
                    }
                    onChange={(
                      event
                    ) =>
                      onAudioChange(
                        {
                          volume:
                            Number(
                              event
                                .target
                                .value
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
                    min="0"
                    max="200"
                    value={
                      audio.volume
                    }
                    disabled={
                      disabled
                    }
                    onChange={(
                      event
                    ) =>
                      onAudioChange(
                        {
                          volume:
                            clamp(
                              toNumber(
                                event
                                  .target
                                  .value,

                                audio.volume
                              ),

                              0,
                              200
                            ),
                        }
                      )
                    }
                    className="
                      w-[62px]
                      bg-[#0B0E13]
                      border
                      border-[#282D36]
                      rounded-lg
                      p-2
                      text-xs
                      outline-none
                      focus:border-violet-500
                    "
                  />
                </div>
              </div>

              {/* FADE IN */}

              <AudioFadeControl
                label="Fade In"
                value={
                  audio.fadeIn
                }
                max={
                  maxFade
                }
                disabled={
                  disabled
                }
                onChange={(
                  value
                ) =>
                  onAudioChange(
                    {
                      fadeIn:
                        value,
                    }
                  )
                }
              />

              {/* FADE OUT */}

              <AudioFadeControl
                label="Fade Out"
                value={
                  audio.fadeOut
                }
                max={
                  maxFade
                }
                disabled={
                  disabled
                }
                onChange={(
                  value
                ) =>
                  onAudioChange(
                    {
                      fadeOut:
                        value,
                    }
                  )
                }
              />
            </div>
          )}

          {/* =================================
              LAYER ORDER
          ================================= */}

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
                    disabled ||
                    cropMode
                  }
                  className="
                    h-9
                    rounded-lg
                    border
                    border-[#282D36]
                    bg-[#0B0E13]
                    text-[10px]
                    text-white/55
                    flex
                    items-center
                    justify-center
                    gap-1.5
                    disabled:opacity-30
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
                    disabled ||
                    cropMode
                  }
                  className="
                    h-9
                    rounded-lg
                    border
                    border-[#282D36]
                    bg-[#0B0E13]
                    text-[10px]
                    text-white/55
                    flex
                    items-center
                    justify-center
                    gap-1.5
                    disabled:opacity-30
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

          {/* =================================
              TEXT
          ================================= */}

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
                "
              />

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
                    onChange={(
                      event
                    ) =>
                      onTextChange(
                        {
                          fontSize:
                            clamp(
                              Number(
                                event
                                  .target
                                  .value
                              ),
                              8,
                              240
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
                    Color
                  </span>

                  <input
                    type="color"
                    value={
                      selectedClip
                        .textStyle
                        .color
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
                      w-full
                      h-[34px]
                      bg-[#0B0E13]
                      border
                      border-[#282D36]
                      rounded-lg
                      p-1
                    "
                  />
                </label>
              </div>

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
                      className={`h-8 rounded-lg border flex items-center justify-center ${
                        selectedClip
                          .textStyle
                          .align ===
                        align
                          ? "border-violet-400 bg-violet-500/15 text-violet-200"
                          : "border-[#282D36] bg-[#0B0E13] text-white/40"
                      }`}
                    >
                      <Icon
                        size={13}
                      />
                    </button>
                  )
                )}
              </div>

              <select
                value={
                  selectedClip
                    .textStyle
                    .fontWeight
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
            </div>
          )}

          {/* =================================
              TRANSFORM
          ================================= */}

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
              <NumberField
                label="Position X"
                value={
                  transform?.x ??
                  0
                }
                disabled={
                  disabled ||
                  cropMode
                }
                onChange={(
                  value
                ) =>
                  onTransformChange(
                    {
                      x:
                        value,
                    }
                  )
                }
              />

              <NumberField
                label="Position Y"
                value={
                  transform?.y ??
                  0
                }
                disabled={
                  disabled ||
                  cropMode
                }
                onChange={(
                  value
                ) =>
                  onTransformChange(
                    {
                      y:
                        value,
                    }
                  )
                }
              />
            </div>

            <div>
              <div
                className="
                  flex
                  gap-2
                  items-center
                  text-[10px]
                  text-white/40
                  mb-2
                "
              >
                <Maximize2
                  size={12}
                />

                Scale
              </div>

              <input
                type="range"
                min="10"
                max="400"
                value={
                  transform?.scale ??
                  100
                }
                disabled={
                  disabled ||
                  cropMode
                }
                onChange={(
                  event
                ) =>
                  onTransformChange(
                    {
                      scale:
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
                  accent-violet-500
                "
              />
            </div>

            <div>
              <div
                className="
                  flex
                  gap-2
                  text-[10px]
                  text-white/40
                  mb-2
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
                  disabled ||
                  cropMode
                }
                onChange={(
                  event
                ) =>
                  onTransformChange(
                    {
                      rotation:
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
                "
              />
            </div>
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
              value={
                transform?.opacity ??
                100
              }
              disabled={
                disabled ||
                cropMode
              }
              onChange={(
                event
              ) =>
                onTransformChange(
                  {
                    opacity:
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
                accent-violet-500
              "
            />
          </div>
        </div>
      )}
    </aside>
  );
}

function AudioFadeControl({
  label,
  value,
  max,
  disabled,
  onChange,
}: {
  label:
    string;

  value:
    number;

  max:
    number;

  disabled:
    boolean;

  onChange: (
    value:
      number
  ) => void;
}) {
  const sliderMax =
    Math.max(
      0.1,
      max
    );

  return (
    <div>
      <div
        className="
          flex
          justify-between
          mb-2
        "
      >
        <span
          className="
            text-[9px]
            text-white/35
          "
        >
          {label}
        </span>

        <span
          className="
            text-[9px]
            text-white/50
          "
        >
          {value.toFixed(
            1
          )}
          s
        </span>
      </div>

      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <input
          type="range"
          min="0"
          max={
            sliderMax
          }
          step="0.1"
          value={
            Math.min(
              value,
              sliderMax
            )
          }
          disabled={
            disabled
          }
          onChange={(
            event
          ) =>
            onChange(
              Number(
                event
                  .target
                  .value
              )
            )
          }
          className="
            flex-1
            accent-violet-500
          "
        />

        <input
          type="number"
          min="0"
          max={
            max
          }
          step="0.1"
          value={
            value
          }
          disabled={
            disabled
          }
          onChange={(
            event
          ) =>
            onChange(
              clamp(
                Number(
                  event
                    .target
                    .value
                ),
                0,
                max
              )
            )
          }
          className="
            w-[62px]
            bg-[#0B0E13]
            border
            border-[#282D36]
            rounded-lg
            p-2
            text-xs
          "
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
}: {
  label:
    string;

  value:
    number;

  disabled:
    boolean;

  onChange: (
    value:
      number
  ) => void;
}) {
  return (
    <label>
      <span
        className="
          text-[9px]
          text-white/35
          block
          mb-1.5
        "
      >
        {label}
      </span>

      <input
        type="number"
        value={
          value
        }
        disabled={
          disabled
        }
        onChange={(
          event
        ) =>
          onChange(
            toNumber(
              event
                .target
                .value,
              value
            )
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
        "
      />
    </label>
  );
}