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

  selectedClipId:
    string | null;

  locked:
    boolean;

  v1Visible:
    boolean;

  v2Visible:
    boolean;

  audioMuted:
    boolean;

  isPlaying:
    boolean;

  currentTime:
    number;

  projectDuration:
    number;

  onTogglePlay:
    () => void;

  onV1TimeUpdate:
    () => void;

  onV1LoadedMetadata:
    () => void;

  onV2LoadedMetadata:
    () => void;

  onSelectClip: (
    clip:
      TimelineClip
  ) => void;

  onBeginTransform: (
    clip:
      TimelineClip
  ) => void;

  onPreviewTransform: (
    clipId:
      string,

    patch:
      Partial<
        TimelineClip["transform"]
      >
  ) => void;

  onCommitTransform:
    () => void;
};

/* =====================================
   TRANSFORM STYLE
===================================== */

function getClipStyle(
  clip:
    TimelineClip | null,

  visible =
    true
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

/* =====================================
   ANGLE HELPERS
===================================== */

function angleFromCenter(
  centerX:
    number,

  centerY:
    number,

  mouseX:
    number,

  mouseY:
    number
) {
  return (
    Math.atan2(
      mouseY -
        centerY,

      mouseX -
        centerX
    ) *
    180 /
    Math.PI
  );
}

function distanceFromCenter(
  centerX:
    number,

  centerY:
    number,

  mouseX:
    number,

  mouseY:
    number
) {
  const dx =
    mouseX -
    centerX;

  const dy =
    mouseY -
    centerY;

  return Math.sqrt(
    dx * dx +
    dy * dy
  );
}

/* =====================================
   COMPONENT
===================================== */

export default function PreviewPanel({
  v1VideoRef,
  v2VideoRef,

  activeV1Media,
  activeV2Media,

  activeV1Clip,
  activeV2Clip,
  activeTextClip,

  selectedClipId,

  locked,

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

  onSelectClip,

  onBeginTransform,

  onPreviewTransform,

  onCommitTransform,
}: Props) {
  const canEdit =
    !isPlaying &&
    !locked;

  const isSelected = (
    clip:
      TimelineClip | null
  ) =>
    !!clip &&
    selectedClipId ===
      clip.id;

  /* =====================================
     DRAG POSITION
  ===================================== */

  const startMove = (
    event:
      React.MouseEvent,

    clip:
      TimelineClip
  ) => {
    if (!canEdit) {
      return;
    }

    event.preventDefault();

    event.stopPropagation();

    onSelectClip(
      clip
    );

    onBeginTransform(
      clip
    );

    const startMouseX =
      event.clientX;

    const startMouseY =
      event.clientY;

    const startX =
      clip.transform.x;

    const startY =
      clip.transform.y;

    document.body.style.cursor =
      "move";

    document.body.style.userSelect =
      "none";

    const handleMouseMove = (
      moveEvent:
        MouseEvent
    ) => {
      const deltaX =
        moveEvent.clientX -
        startMouseX;

      const deltaY =
        moveEvent.clientY -
        startMouseY;

      onPreviewTransform(
        clip.id,

        {
          x:
            startX +
            deltaX,

          y:
            startY +
            deltaY,
        }
      );
    };

    const handleMouseUp =
      () => {
        window.removeEventListener(
          "mousemove",

          handleMouseMove
        );

        window.removeEventListener(
          "mouseup",

          handleMouseUp
        );

        document.body.style.cursor =
          "";

        document.body.style.userSelect =
          "";

        onCommitTransform();
      };

    window.addEventListener(
      "mousemove",

      handleMouseMove
    );

    window.addEventListener(
      "mouseup",

      handleMouseUp
    );
  };

  /* =====================================
     SCALE
  ===================================== */

  const startScale = (
    event:
      React.MouseEvent,

    clip:
      TimelineClip
  ) => {
    if (!canEdit) {
      return;
    }

    event.preventDefault();

    event.stopPropagation();

    onBeginTransform(
      clip
    );

    const layer =
      (
        event.currentTarget as HTMLElement
      ).closest(
        "[data-transform-layer]"
      ) as
        HTMLElement | null;

    if (!layer) {
      return;
    }

    const rect =
      layer.getBoundingClientRect();

    const centerX =
      rect.left +
      rect.width / 2;

    const centerY =
      rect.top +
      rect.height / 2;

    const startDistance =
      Math.max(
        1,

        distanceFromCenter(
          centerX,
          centerY,
          event.clientX,
          event.clientY
        )
      );

    const startScaleValue =
      clip.transform.scale;

    document.body.style.cursor =
      "nwse-resize";

    document.body.style.userSelect =
      "none";

    const handleMouseMove = (
      moveEvent:
        MouseEvent
    ) => {
      const currentDistance =
        distanceFromCenter(
          centerX,
          centerY,

          moveEvent.clientX,
          moveEvent.clientY
        );

      const ratio =
        currentDistance /
        startDistance;

      const nextScale =
        Math.max(
          10,

          Math.min(
            400,

            startScaleValue *
              ratio
          )
        );

      onPreviewTransform(
        clip.id,

        {
          scale:
            Math.round(
              nextScale *
                10
            ) / 10,
        }
      );
    };

    const handleMouseUp =
      () => {
        window.removeEventListener(
          "mousemove",

          handleMouseMove
        );

        window.removeEventListener(
          "mouseup",

          handleMouseUp
        );

        document.body.style.cursor =
          "";

        document.body.style.userSelect =
          "";

        onCommitTransform();
      };

    window.addEventListener(
      "mousemove",

      handleMouseMove
    );

    window.addEventListener(
      "mouseup",

      handleMouseUp
    );
  };

  /* =====================================
     ROTATE
  ===================================== */

  const startRotate = (
    event:
      React.MouseEvent,

    clip:
      TimelineClip
  ) => {
    if (!canEdit) {
      return;
    }

    event.preventDefault();

    event.stopPropagation();

    onBeginTransform(
      clip
    );

    const layer =
      (
        event.currentTarget as HTMLElement
      ).closest(
        "[data-transform-layer]"
      ) as
        HTMLElement | null;

    if (!layer) {
      return;
    }

    const rect =
      layer.getBoundingClientRect();

    const centerX =
      rect.left +
      rect.width / 2;

    const centerY =
      rect.top +
      rect.height / 2;

    const startAngle =
      angleFromCenter(
        centerX,
        centerY,

        event.clientX,
        event.clientY
      );

    const initialRotation =
      clip.transform.rotation;

    document.body.style.cursor =
      "grabbing";

    document.body.style.userSelect =
      "none";

    const handleMouseMove = (
      moveEvent:
        MouseEvent
    ) => {
      const currentAngle =
        angleFromCenter(
          centerX,
          centerY,

          moveEvent.clientX,
          moveEvent.clientY
        );

      const delta =
        currentAngle -
        startAngle;

      let nextRotation =
        initialRotation +
        delta;

      /*
        Shift = 15 degree snapping
      */

      if (
        moveEvent.shiftKey
      ) {
        nextRotation =
          Math.round(
            nextRotation /
              15
          ) * 15;
      }

      onPreviewTransform(
        clip.id,

        {
          rotation:
            Math.round(
              nextRotation *
                10
            ) / 10,
        }
      );
    };

    const handleMouseUp =
      () => {
        window.removeEventListener(
          "mousemove",

          handleMouseMove
        );

        window.removeEventListener(
          "mouseup",

          handleMouseUp
        );

        document.body.style.cursor =
          "";

        document.body.style.userSelect =
          "";

        onCommitTransform();
      };

    window.addEventListener(
      "mousemove",

      handleMouseMove
    );

    window.addEventListener(
      "mouseup",

      handleMouseUp
    );
  };

  return (
    <section
      className="
        flex-1
        min-w-0
        flex
        flex-col
        bg-[#090B0F]
      "
    >
      {/* =================================
          PREVIEW AREA
      ================================= */}

      <div
        className="
          flex-1
          min-h-0
          flex
          items-center
          justify-center
          px-4
          py-3
          overflow-hidden
        "
      >
        {/* CANVAS */}

        <div
          className="
            relative
            aspect-video
            w-[min(96%,1100px)]
            max-h-[96%]
            bg-black
            rounded-xl
            overflow-hidden
            border
            border-[#242933]
            shadow-2xl
            shadow-black/40
          "
        >
          {/* =============================
              V1
          ============================= */}

          {activeV1Media &&
            activeV1Clip?.kind ===
              "video" && (
              <div
                data-transform-layer
                onMouseDown={(
                  event
                ) =>
                  startMove(
                    event,
                    activeV1Clip
                  )
                }
                style={
                  getClipStyle(
                    activeV1Clip,
                    v1Visible
                  )
                }
                className={`
                  absolute
                  inset-0

                  ${
                    canEdit
                      ? "cursor-move"
                      : "cursor-default"
                  }

                  ${
                    isSelected(
                      activeV1Clip
                    )
                      ? "z-[4]"
                      : "z-[1]"
                  }
                `}
              >
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
                  draggable={
                    false
                  }
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-contain
                    pointer-events-none
                  "
                />

                {isSelected(
                  activeV1Clip
                ) && (
                  <SelectionOutline
                    label="V1"

                    disabled={
                      !canEdit
                    }

                    onScaleStart={(
                      event
                    ) =>
                      startScale(
                        event,

                        activeV1Clip
                      )
                    }

                    onRotateStart={(
                      event
                    ) =>
                      startRotate(
                        event,

                        activeV1Clip
                      )
                    }
                  />
                )}
              </div>
            )}

          {/* =============================
              V2
          ============================= */}

          {activeV2Media &&
            activeV2Clip?.kind ===
              "video" && (
              <div
                data-transform-layer
                onMouseDown={(
                  event
                ) =>
                  startMove(
                    event,

                    activeV2Clip
                  )
                }
                style={
                  getClipStyle(
                    activeV2Clip,
                    v2Visible
                  )
                }
                className={`
                  absolute
                  inset-0

                  ${
                    canEdit
                      ? "cursor-move"
                      : "cursor-default"
                  }

                  ${
                    isSelected(
                      activeV2Clip
                    )
                      ? "z-[14]"
                      : "z-[10]"
                  }
                `}
              >
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
                  draggable={
                    false
                  }
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-contain
                    pointer-events-none
                  "
                />

                {isSelected(
                  activeV2Clip
                ) && (
                  <SelectionOutline
                    label="V2"

                    disabled={
                      !canEdit
                    }

                    onScaleStart={(
                      event
                    ) =>
                      startScale(
                        event,

                        activeV2Clip
                      )
                    }

                    onRotateStart={(
                      event
                    ) =>
                      startRotate(
                        event,

                        activeV2Clip
                      )
                    }
                  />
                )}
              </div>
            )}

          {/* =============================
              TEXT
          ============================= */}

          {activeTextClip?.kind ===
            "text" && (
            <div
              data-transform-layer
              onMouseDown={(
                event
              ) =>
                startMove(
                  event,

                  activeTextClip
                )
              }
              style={
                getClipStyle(
                  activeTextClip
                )
              }
              className={`
                absolute
                inset-0
                flex
                items-center
                justify-center
                px-8

                ${
                  canEdit
                    ? "cursor-move"
                    : "cursor-default"
                }

                ${
                  isSelected(
                    activeTextClip
                  )
                    ? "z-[24]"
                    : "z-[20]"
                }
              `}
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
                  pointer-events-none
                "
              >
                {
                  activeTextClip.text
                }
              </div>

              {isSelected(
                activeTextClip
              ) && (
                <SelectionOutline
                  label="T1"

                  disabled={
                    !canEdit
                  }

                  onScaleStart={(
                    event
                  ) =>
                    startScale(
                      event,

                      activeTextClip
                    )
                  }

                  onRotateStart={(
                    event
                  ) =>
                    startRotate(
                      event,

                      activeTextClip
                    )
                  }
                />
              )}
            </div>
          )}

          {/* EMPTY */}

          {!activeV1Clip &&
            !activeV2Clip &&
            !activeTextClip && (
              <div
                className="
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                  text-white/25
                  text-xs
                "
              >
                Move the
                playhead over a
                clip
              </div>
            )}

          {/* CENTER X */}

          <div
            className="
              absolute
              left-1/2
              top-0
              bottom-0
              w-px
              bg-white/[0.025]
              pointer-events-none
              z-[100]
            "
          />

          {/* CENTER Y */}

          <div
            className="
              absolute
              top-1/2
              left-0
              right-0
              h-px
              bg-white/[0.025]
              pointer-events-none
              z-[100]
            "
          />
        </div>
      </div>

      {/* =================================
          PLAYBACK
      ================================= */}

      <div
        className="
          h-12
          shrink-0
          border-t
          border-[#1D222B]
          flex
          items-center
          justify-center
          gap-5
        "
      >
        <span
          className="
            text-xs
            text-white/40
            tabular-nums
          "
        >
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
          className="
            w-8
            h-8
            rounded-full
            bg-white
            text-black
            flex
            items-center
            justify-center
            disabled:opacity-30
            hover:scale-105
            active:scale-95
            transition
          "
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

        <span
          className="
            text-xs
            text-white/40
            tabular-nums
          "
        >
          {formatTime(
            projectDuration
          )}
        </span>
      </div>
    </section>
  );
}

/* =====================================
   SELECTION OUTLINE
===================================== */

function SelectionOutline({
  label,

  disabled,

  onScaleStart,

  onRotateStart,
}: {
  label:
    string;

  disabled:
    boolean;

  onScaleStart: (
    event:
      React.MouseEvent
  ) => void;

  onRotateStart: (
    event:
      React.MouseEvent
  ) => void;
}) {
  return (
    <div
      className="
        absolute
        inset-0
        border
        border-violet-400
        pointer-events-none
      "
    >
      {/* LABEL */}

      <div
        className="
          absolute
          top-2
          left-2
          h-5
          px-2
          rounded-md
          bg-violet-500
          text-[9px]
          font-semibold
          text-white
          flex
          items-center
          pointer-events-none
        "
      >
        {label}
      </div>

      {/* =============================
          ROTATION HANDLE
      ============================= */}

      <div
        className="
          absolute
          left-1/2
          -translate-x-1/2
          -top-[31px]
          h-[31px]
          w-px
          bg-violet-400
        "
      />

      <button
        onMouseDown={
          onRotateStart
        }
        disabled={
          disabled
        }
        title="Drag to rotate • Hold Shift for 15° snapping"
        className="
          absolute
          left-1/2
          -translate-x-1/2
          -top-[39px]
          w-[16px]
          h-[16px]
          rounded-full
          bg-white
          border-2
          border-violet-500
          pointer-events-auto
          cursor-grab
          active:cursor-grabbing
          disabled:cursor-default
          disabled:opacity-40
        "
      />

      {/* =============================
          CORNER HANDLES
      ============================= */}

      <ScaleHandle
        className="
          -left-[6px]
          -top-[6px]
          cursor-nwse-resize
        "
        disabled={
          disabled
        }
        onMouseDown={
          onScaleStart
        }
      />

      <ScaleHandle
        className="
          -right-[6px]
          -top-[6px]
          cursor-nesw-resize
        "
        disabled={
          disabled
        }
        onMouseDown={
          onScaleStart
        }
      />

      <ScaleHandle
        className="
          -left-[6px]
          -bottom-[6px]
          cursor-nesw-resize
        "
        disabled={
          disabled
        }
        onMouseDown={
          onScaleStart
        }
      />

      <ScaleHandle
        className="
          -right-[6px]
          -bottom-[6px]
          cursor-nwse-resize
        "
        disabled={
          disabled
        }
        onMouseDown={
          onScaleStart
        }
      />
    </div>
  );
}

function ScaleHandle({
  className,

  disabled,

  onMouseDown,
}: {
  className:
    string;

  disabled:
    boolean;

  onMouseDown: (
    event:
      React.MouseEvent
  ) => void;
}) {
  return (
    <button
      onMouseDown={
        onMouseDown
      }
      disabled={
        disabled
      }
      className={`
        absolute
        w-[12px]
        h-[12px]
        rounded-[3px]
        bg-white
        border-2
        border-violet-500
        pointer-events-auto
        disabled:cursor-default
        disabled:opacity-40

        ${className}
      `}
    />
  );
}