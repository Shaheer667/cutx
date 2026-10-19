"use client";

import {
  Pause,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Square,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  MediaItem,
  TimelineClip,
} from "@/types/editor";

import {
  formatTime,
} from "@/utils/time";

export type ProjectAspectRatio =
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:5";

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

  activeTextClips:
    TimelineClip[];

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

  aspectRatio:
    ProjectAspectRatio;

  onAspectRatioChange: (
    ratio: ProjectAspectRatio
  ) => void;

  onTogglePlay:
    () => void;

  onV1TimeUpdate:
    () => void;

  onV1LoadedMetadata:
    () => void;

  onV2LoadedMetadata:
    () => void;

  onSelectClip: (
    clip: TimelineClip
  ) => void;

  onBeginTransform: (
    clip: TimelineClip
  ) => void;

  onPreviewTransform: (
    clipId: string,

    patch: Partial<
      TimelineClip["transform"]
    >
  ) => void;

  onCommitTransform:
    () => void;
};

type Size = {
  width: number;
  height: number;
};

type SnapGuides = {
  x: boolean;
  y: boolean;
};

const CENTER_SNAP_THRESHOLD =
  8;

const aspectRatioValues:
  Record<
    ProjectAspectRatio,
    number
  > = {
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "1:1": 1,
  "4:5": 4 / 5,
};

/* =====================================
   HELPERS
===================================== */

function distanceFromCenter(
  centerX: number,
  centerY: number,
  mouseX: number,
  mouseY: number
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

function angleFromCenter(
  centerX: number,
  centerY: number,
  mouseX: number,
  mouseY: number
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

function getContainedSize(
  containerWidth: number,
  containerHeight: number,
  mediaWidth: number,
  mediaHeight: number
): Size {
  if (
    !containerWidth ||
    !containerHeight ||
    !mediaWidth ||
    !mediaHeight
  ) {
    return {
      width:
        containerWidth,

      height:
        containerHeight,
    };
  }

  const containerRatio =
    containerWidth /
    containerHeight;

  const mediaRatio =
    mediaWidth /
    mediaHeight;

  if (
    mediaRatio >
    containerRatio
  ) {
    return {
      width:
        containerWidth,

      height:
        containerWidth /
        mediaRatio,
    };
  }

  return {
    width:
      containerHeight *
      mediaRatio,

    height:
      containerHeight,
  };
}

function getTransformStyle(
  clip: TimelineClip,

  visible = true
): React.CSSProperties {
  const {
    x,
    y,
    scale,
    rotation,
    opacity,
  } =
    clip.transform;

  return {
    left:
      "50%",

    top:
      "50%",

    transform: `
      translate(-50%, -50%)
      translate(${x}px, ${y}px)
      scale(${scale / 100})
      rotate(${rotation}deg)
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
   COMPONENT
===================================== */

export default function PreviewPanel({
  v1VideoRef,
  v2VideoRef,

  activeV1Media,
  activeV2Media,

  activeV1Clip,
  activeV2Clip,

  activeTextClips,

  selectedClipId,

  locked,

  v1Visible,
  v2Visible,

  audioMuted,

  isPlaying,

  currentTime,
  projectDuration,

  aspectRatio,
  onAspectRatioChange,

  onTogglePlay,

  onV1TimeUpdate,

  onV1LoadedMetadata,

  onV2LoadedMetadata,

  onSelectClip,

  onBeginTransform,

  onPreviewTransform,

  onCommitTransform,
}: Props) {
  const canvasRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    canvasSize,
    setCanvasSize,
  ] = useState<Size>({
    width: 0,
    height: 0,
  });

  const [
    v1NaturalSize,
    setV1NaturalSize,
  ] = useState<Size>({
    width: 16,
    height: 9,
  });

  const [
    v2NaturalSize,
    setV2NaturalSize,
  ] = useState<Size>({
    width: 16,
    height: 9,
  });

  const [
    snapGuides,
    setSnapGuides,
  ] = useState<SnapGuides>({
    x: false,
    y: false,
  });

  const canEdit =
    !isPlaying &&
    !locked;

  /* =====================================
     CANVAS SIZE
  ===================================== */

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const updateSize =
      () => {
        const rect =
          canvas.getBoundingClientRect();

        setCanvasSize({
          width:
            rect.width,

          height:
            rect.height,
        });
      };

    updateSize();

    const observer =
      new ResizeObserver(
        updateSize
      );

    observer.observe(
      canvas
    );

    return () =>
      observer.disconnect();
  }, [
    aspectRatio,
  ]);

  /* =====================================
     VIDEO METADATA
  ===================================== */

  const handleV1Metadata =
    () => {
      const video =
        v1VideoRef.current;

      if (
        video?.videoWidth &&
        video?.videoHeight
      ) {
        setV1NaturalSize({
          width:
            video.videoWidth,

          height:
            video.videoHeight,
        });
      }

      onV1LoadedMetadata();
    };

  const handleV2Metadata =
    () => {
      const video =
        v2VideoRef.current;

      if (
        video?.videoWidth &&
        video?.videoHeight
      ) {
        setV2NaturalSize({
          width:
            video.videoWidth,

          height:
            video.videoHeight,
        });
      }

      onV2LoadedMetadata();
    };

  const v1DisplaySize =
    getContainedSize(
      canvasSize.width,
      canvasSize.height,
      v1NaturalSize.width,
      v1NaturalSize.height
    );

  const v2DisplaySize =
    getContainedSize(
      canvasSize.width,
      canvasSize.height,
      v2NaturalSize.width,
      v2NaturalSize.height
    );

  const isSelected = (
    clip:
      TimelineClip | null
  ) =>
    !!clip &&
    clip.id ===
      selectedClipId;

  /* =====================================
     MOVE
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

      let nextX =
        startX +
        deltaX;

      let nextY =
        startY +
        deltaY;

      let snapX =
        false;

      let snapY =
        false;

      /*
        Alt temporarily disables
        center snapping.
      */

      if (
        !moveEvent.altKey
      ) {
        if (
          Math.abs(
            nextX
          ) <=
          CENTER_SNAP_THRESHOLD
        ) {
          nextX = 0;

          snapX = true;
        }

        if (
          Math.abs(
            nextY
          ) <=
          CENTER_SNAP_THRESHOLD
        ) {
          nextY = 0;

          snapY = true;
        }
      }

      setSnapGuides({
        x:
          snapX,

        y:
          snapY,
      });

      onPreviewTransform(
        clip.id,

        {
          x:
            Math.round(
              nextX *
                10
            ) / 10,

          y:
            Math.round(
              nextY *
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

        setSnapGuides({
          x: false,
          y: false,
        });

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

    const startingScale =
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

      let nextScale =
        startingScale *
        ratio;

      nextScale =
        Math.max(
          10,

          Math.min(
            400,
            nextScale
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

    const startingAngle =
      angleFromCenter(
        centerX,
        centerY,

        event.clientX,
        event.clientY
      );

    const startingRotation =
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

      let rotation =
        startingRotation +
        (
          currentAngle -
          startingAngle
        );

      /*
        Hold Shift to snap
        rotation by 15 degrees.
      */

      if (
        moveEvent.shiftKey
      ) {
        rotation =
          Math.round(
            rotation /
              15
          ) * 15;
      }

      onPreviewTransform(
        clip.id,

        {
          rotation:
            Math.round(
              rotation *
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
          PREVIEW TOP TOOLBAR
      ================================= */}

      <div
        className="
          h-11
          shrink-0
          border-b
          border-[#1D222B]
          flex
          items-center
          justify-between
          px-4
          bg-[#0D1015]
        "
      >
        <div>
          <span
            className="
              text-[10px]
              text-white/30
            "
          >
            Canvas
          </span>
        </div>

        <div
          className="
            flex
            items-center
            gap-1
            p-1
            rounded-lg
            bg-[#090B0F]
            border
            border-[#242933]
          "
        >
          <AspectButton
            active={
              aspectRatio ===
              "16:9"
            }
            label="16:9"
            title="Landscape 16:9"
            onClick={() =>
              onAspectRatioChange(
                "16:9"
              )
            }
          >
            <RectangleHorizontal
              size={13}
            />
          </AspectButton>

          <AspectButton
            active={
              aspectRatio ===
              "9:16"
            }
            label="9:16"
            title="Vertical 9:16"
            onClick={() =>
              onAspectRatioChange(
                "9:16"
              )
            }
          >
            <RectangleVertical
              size={13}
            />
          </AspectButton>

          <AspectButton
            active={
              aspectRatio ===
              "1:1"
            }
            label="1:1"
            title="Square 1:1"
            onClick={() =>
              onAspectRatioChange(
                "1:1"
              )
            }
          >
            <Square
              size={12}
            />
          </AspectButton>

          <AspectButton
            active={
              aspectRatio ===
              "4:5"
            }
            label="4:5"
            title="Portrait 4:5"
            onClick={() =>
              onAspectRatioChange(
                "4:5"
              )
            }
          >
            <RectangleVertical
              size={12}
            />
          </AspectButton>
        </div>

        <div
          className="
            min-w-[46px]
            text-right
            text-[10px]
            text-white/30
          "
        >
          {aspectRatio}
        </div>
      </div>

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
          px-5
          py-4
          overflow-hidden
        "
      >
        {/* CANVAS */}

        <div
          ref={
            canvasRef
          }
          style={{
            aspectRatio:
              aspectRatioValues[
                aspectRatio
              ],
          }}
          className="
            relative
            h-[92%]
            w-auto
            max-w-[96%]
            max-h-[96%]
            bg-black
            rounded-xl
            overflow-hidden
            border
            border-[#292E38]
            shadow-2xl
            shadow-black/50
          "
        >
          {/* =================================
              V1
          ================================= */}

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
                style={{
                  ...getTransformStyle(
                    activeV1Clip,
                    v1Visible
                  ),

                  width: `${
                    v1DisplaySize.width
                  }px`,

                  height: `${
                    v1DisplaySize.height
                  }px`,

                  zIndex: 1,
                }}
                className={`
                  absolute

                  ${
                    canEdit
                      ? "cursor-move"
                      : "cursor-default"
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
                    handleV1Metadata
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
                    object-fill
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

          {/* =================================
              V2
          ================================= */}

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
                style={{
                  ...getTransformStyle(
                    activeV2Clip,
                    v2Visible
                  ),

                  width: `${
                    v2DisplaySize.width
                  }px`,

                  height: `${
                    v2DisplaySize.height
                  }px`,

                  zIndex:
                    activeV2Clip.zIndex +
                    20,
                }}
                className={`
                  absolute

                  ${
                    canEdit
                      ? "cursor-move"
                      : "cursor-default"
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
                    handleV2Metadata
                  }
                  draggable={
                    false
                  }
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-fill
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

          {/* =================================
              MULTIPLE TEXT LAYERS
          ================================= */}

          {activeTextClips.map(
            (textClip) => {
              if (
                textClip.kind !==
                "text"
              ) {
                return null;
              }

              return (
                <div
                  key={
                    textClip.id
                  }
                  data-transform-layer
                  onMouseDown={(
                    event
                  ) =>
                    startMove(
                      event,
                      textClip
                    )
                  }
                  style={{
                    ...getTransformStyle(
                      textClip
                    ),

                    zIndex:
                      textClip.zIndex +
                      20,
                  }}
                  className={`
                    absolute
                    inline-flex
                    min-w-[40px]
                    max-w-[85%]
                    px-2
                    py-1

                    ${
                      canEdit
                        ? "cursor-move"
                        : "cursor-default"
                    }
                  `}
                >
                  <div
                    style={{
                      color:
                        textClip
                          .textStyle
                          .color,

                      fontSize: `${
                        textClip
                          .textStyle
                          .fontSize
                      }px`,

                      fontWeight:
                        textClip
                          .textStyle
                          .fontWeight,

                      textAlign:
                        textClip
                          .textStyle
                          .align,
                    }}
                    className="
                      whitespace-pre-wrap
                      break-words
                      leading-tight
                      drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]
                      pointer-events-none
                    "
                  >
                    {
                      textClip.text
                    }
                  </div>

                  {isSelected(
                    textClip
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
                          textClip
                        )
                      }

                      onRotateStart={(
                        event
                      ) =>
                        startRotate(
                          event,
                          textClip
                        )
                      }
                    />
                  )}
                </div>
              );
            }
          )}

          {/* =================================
              SNAP GUIDES
          ================================= */}

          {snapGuides.x && (
            <div
              className="
                absolute
                top-0
                bottom-0
                left-1/2
                z-[200]
                w-px
                bg-fuchsia-400
                shadow-[0_0_6px_rgba(232,121,249,0.8)]
                pointer-events-none
              "
            />
          )}

          {snapGuides.y && (
            <div
              className="
                absolute
                left-0
                right-0
                top-1/2
                z-[200]
                h-px
                bg-fuchsia-400
                shadow-[0_0_6px_rgba(232,121,249,0.8)]
                pointer-events-none
              "
            />
          )}

          {/* =================================
              SAFE AREA
          ================================= */}

          <div
            className="
              absolute
              inset-[8%]
              border
              border-dashed
              border-white/[0.07]
              rounded
              pointer-events-none
              z-[90]
            "
          />

          {/* EMPTY */}

          {!activeV1Clip &&
            !activeV2Clip &&
            activeTextClips.length ===
              0 && (
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
                Move the playhead
                over a clip
              </div>
            )}
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
   ASPECT BUTTON
===================================== */

function AspectButton({
  active,
  label,
  title,
  onClick,
  children,
}: {
  active: boolean;

  label: string;

  title: string;

  onClick:
    () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={
        title
      }
      onClick={
        onClick
      }
      className={`
        h-7
        px-2
        rounded-md
        flex
        items-center
        gap-1.5
        text-[9px]
        transition

        ${
          active
            ? "bg-violet-500/20 text-violet-200 border border-violet-500/30"
            : "text-white/35 border border-transparent hover:text-white hover:bg-white/5"
        }
      `}
    >
      {children}

      {label}
    </button>
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
  label: string;

  disabled: boolean;

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

      {/* ROTATION LINE */}

      <div
        className="
          absolute
          left-1/2
          -translate-x-1/2
          -top-[30px]
          h-[30px]
          w-px
          bg-violet-400
        "
      />

      {/* ROTATION HANDLE */}

      <button
        onMouseDown={
          onRotateStart
        }
        disabled={
          disabled
        }
        title="Rotate • Hold Shift for 15° snapping"
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

      <ScaleHandle
        className="-left-[6px] -top-[6px] cursor-nwse-resize"
        disabled={
          disabled
        }
        onMouseDown={
          onScaleStart
        }
      />

      <ScaleHandle
        className="-right-[6px] -top-[6px] cursor-nesw-resize"
        disabled={
          disabled
        }
        onMouseDown={
          onScaleStart
        }
      />

      <ScaleHandle
        className="-left-[6px] -bottom-[6px] cursor-nesw-resize"
        disabled={
          disabled
        }
        onMouseDown={
          onScaleStart
        }
      />

      <ScaleHandle
        className="-right-[6px] -bottom-[6px] cursor-nwse-resize"
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
  className: string;

  disabled: boolean;

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