"use client";

import {
  Check,
  Pause,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ClipTransform,
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

type CropValues = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

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

  cropMode:
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
    ratio:
      ProjectAspectRatio
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

  onApplyCrop: (
    patch:
      Partial<ClipTransform>
  ) => void;

  onCloseCrop:
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

const MAX_CROP =
  90;

const MIN_VISIBLE_PERCENT =
  10;

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

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(
    min,

    Math.min(
      max,
      value
    )
  );
}

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

function getCoverSize(
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
      height:
        containerHeight,

      width:
        containerHeight *
        mediaRatio,
    };
  }

  return {
    width:
      containerWidth,

    height:
      containerWidth /
      mediaRatio,
  };
}

function getTransformStyle(
  clip:
    TimelineClip,

  visible =
    true
):
  React.CSSProperties {
  const {
    x,
    y,
    scale,
    rotation,
    opacity,
    flipX,
    flipY,
  } =
    clip.transform;

  const horizontalFlip =
    flipX
      ? -1
      : 1;

  const verticalFlip =
    flipY
      ? -1
      : 1;

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
      scaleX(${horizontalFlip})
      scaleY(${verticalFlip})
    `,

    transformOrigin:
      "center center",

    opacity:
      visible
        ? opacity / 100
        : 0,
  };
}

function getCropFromClip(
  clip:
    TimelineClip | null
): CropValues {
  return {
    top:
      clip?.transform
        .cropTop ??
      0,

    right:
      clip?.transform
        .cropRight ??
      0,

    bottom:
      clip?.transform
        .cropBottom ??
      0,

    left:
      clip?.transform
        .cropLeft ??
      0,
  };
}

function getClipPath(
  clip:
    TimelineClip,

  overrideCrop?:
    CropValues
) {
  const crop =
    overrideCrop ??
    getCropFromClip(
      clip
    );

  return `inset(
    ${crop.top}%
    ${crop.right}%
    ${crop.bottom}%
    ${crop.left}%
  )`;
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

  cropMode,

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

  onApplyCrop,
  onCloseCrop,
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

  const [
    cropDraft,
    setCropDraft,
  ] = useState<CropValues>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  const canEdit =
    !isPlaying &&
    !locked &&
    !cropMode;

  /* =====================================
     SELECTED VIDEO FOR CROP
  ===================================== */

  const selectedVideoClip =
    activeV1Clip?.id ===
    selectedClipId
      ? activeV1Clip
      : activeV2Clip?.id ===
        selectedClipId
      ? activeV2Clip
      : null;

  useEffect(() => {
    if (
      cropMode &&
      selectedVideoClip
    ) {
      setCropDraft(
        getCropFromClip(
          selectedVideoClip
        )
      );
    }
  }, [
    cropMode,
    selectedClipId,
  ]);

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
     METADATA
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

  /* =====================================
     FIT / FILL
  ===================================== */

  const v1FitMode =
    activeV1Clip
      ?.transform
      .fitMode ??
    "fit";

  const v2FitMode =
    activeV2Clip
      ?.transform
      .fitMode ??
    "fit";

  const v1DisplaySize =
    v1FitMode ===
    "fill"
      ? getCoverSize(
          canvasSize.width,
          canvasSize.height,
          v1NaturalSize.width,
          v1NaturalSize.height
        )
      : getContainedSize(
          canvasSize.width,
          canvasSize.height,
          v1NaturalSize.width,
          v1NaturalSize.height
        );

  const v2DisplaySize =
    v2FitMode ===
    "fill"
      ? getCoverSize(
          canvasSize.width,
          canvasSize.height,
          v2NaturalSize.width,
          v2NaturalSize.height
        )
      : getContainedSize(
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
        clamp(
          nextScale,
          10,
          400
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

  /* =====================================
     CROP HANDLE
  ===================================== */

  const startCropHandle = (
    event:
      React.MouseEvent,

    side:
      | "top"
      | "right"
      | "bottom"
      | "left"
  ) => {
    if (
      !cropMode ||
      !selectedVideoClip
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

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

    const startX =
      event.clientX;

    const startY =
      event.clientY;

    const initial =
      {
        ...cropDraft,
      };

    document.body.style.userSelect =
      "none";

    document.body.style.cursor =
      side === "left" ||
      side === "right"
        ? "ew-resize"
        : "ns-resize";

    const handleMouseMove = (
      moveEvent:
        MouseEvent
    ) => {
      const deltaX =
        moveEvent.clientX -
        startX;

      const deltaY =
        moveEvent.clientY -
        startY;

      const deltaXPercent =
        rect.width
          ? (
              deltaX /
              rect.width
            ) * 100
          : 0;

      const deltaYPercent =
        rect.height
          ? (
              deltaY /
              rect.height
            ) * 100
          : 0;

      let next =
        {
          ...initial,
        };

      if (
        side === "left"
      ) {
        next.left =
          clamp(
            initial.left +
              deltaXPercent,

            0,

            Math.min(
              MAX_CROP,

              100 -
                initial.right -
                MIN_VISIBLE_PERCENT
            )
          );
      }

      if (
        side === "right"
      ) {
        next.right =
          clamp(
            initial.right -
              deltaXPercent,

            0,

            Math.min(
              MAX_CROP,

              100 -
                initial.left -
                MIN_VISIBLE_PERCENT
            )
          );
      }

      if (
        side === "top"
      ) {
        next.top =
          clamp(
            initial.top +
              deltaYPercent,

            0,

            Math.min(
              MAX_CROP,

              100 -
                initial.bottom -
                MIN_VISIBLE_PERCENT
            )
          );
      }

      if (
        side === "bottom"
      ) {
        next.bottom =
          clamp(
            initial.bottom -
              deltaYPercent,

            0,

            Math.min(
              MAX_CROP,

              100 -
                initial.top -
                MIN_VISIBLE_PERCENT
            )
          );
      }

      next = {
        top:
          Math.round(
            next.top *
              10
          ) / 10,

        right:
          Math.round(
            next.right *
              10
          ) / 10,

        bottom:
          Math.round(
            next.bottom *
              10
          ) / 10,

        left:
          Math.round(
            next.left *
              10
          ) / 10,
      };

      setCropDraft(
        next
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
     CROP APPLY / CANCEL
  ===================================== */

  const applyCrop =
    () => {
      if (
        !selectedVideoClip
      ) {
        return;
      }

      onApplyCrop({
        cropTop:
          cropDraft.top,

        cropRight:
          cropDraft.right,

        cropBottom:
          cropDraft.bottom,

        cropLeft:
          cropDraft.left,
      });

      onCloseCrop();
    };

  const cancelCrop =
    () => {
      setCropDraft(
        getCropFromClip(
          selectedVideoClip
        )
      );

      onCloseCrop();
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
          PREVIEW TOP BAR
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
        <span
          className="
            text-[10px]
            text-white/30
          "
        >
          {cropMode
            ? "Crop Mode"
            : "Canvas"}
        </span>

        {!cropMode ? (
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
        ) : (
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <button
              onClick={
                cancelCrop
              }
              className="
                h-7
                px-3
                rounded-lg
                border
                border-[#2A3039]
                text-[10px]
                text-white/55
                hover:text-white
                hover:bg-white/5
                flex
                items-center
                gap-1.5
              "
            >
              <X
                size={12}
              />

              Cancel
            </button>

            <button
              onClick={
                applyCrop
              }
              className="
                h-7
                px-3
                rounded-lg
                bg-violet-500
                text-[10px]
                text-white
                hover:bg-violet-400
                flex
                items-center
                gap-1.5
              "
            >
              <Check
                size={12}
              />

              Apply
            </button>
          </div>
        )}

        <span
          className="
            min-w-[46px]
            text-right
            text-[10px]
            text-white/30
          "
        >
          {aspectRatio}
        </span>
      </div>

      {/* =================================
          PREVIEW
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
                  style={{
                    clipPath:
                      getClipPath(
                        activeV1Clip,

                        cropMode &&
                        isSelected(
                          activeV1Clip
                        )
                          ? cropDraft
                          : undefined
                      ),
                  }}
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-fill
                    pointer-events-none
                  "
                />

                {cropMode &&
                isSelected(
                  activeV1Clip
                ) ? (
                  <CropOverlay
                    crop={
                      cropDraft
                    }
                    onStart={
                      startCropHandle
                    }
                  />
                ) : (
                  isSelected(
                    activeV1Clip
                  ) && (
                    <SelectionOutline
                      label={
                        v1FitMode ===
                        "fill"
                          ? "V1 · Fill"
                          : "V1 · Fit"
                      }

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
                  )
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
                  style={{
                    clipPath:
                      getClipPath(
                        activeV2Clip,

                        cropMode &&
                        isSelected(
                          activeV2Clip
                        )
                          ? cropDraft
                          : undefined
                      ),
                  }}
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-fill
                    pointer-events-none
                  "
                />

                {cropMode &&
                isSelected(
                  activeV2Clip
                ) ? (
                  <CropOverlay
                    crop={
                      cropDraft
                    }
                    onStart={
                      startCropHandle
                    }
                  />
                ) : (
                  isSelected(
                    activeV2Clip
                  ) && (
                    <SelectionOutline
                      label={
                        v2FitMode ===
                        "fill"
                          ? "V2 · Fill"
                          : "V2 · Fit"
                      }

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
                  )
                )}
              </div>
            )}

          {/* =================================
              TEXT
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

                  {!cropMode &&
                    isSelected(
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

          {/* SNAP GUIDES */}

          {snapGuides.x &&
            !cropMode && (
              <div
                className="
                  absolute
                  top-0
                  bottom-0
                  left-1/2
                  z-[200]
                  w-px
                  bg-fuchsia-400
                  pointer-events-none
                "
              />
            )}

          {snapGuides.y &&
            !cropMode && (
              <div
                className="
                  absolute
                  left-0
                  right-0
                  top-1/2
                  z-[200]
                  h-px
                  bg-fuchsia-400
                  pointer-events-none
                "
              />
            )}

          {/* SAFE AREA */}

          {!cropMode && (
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
          )}

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
            !projectDuration ||
            cropMode
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
   CROP OVERLAY
===================================== */

function CropOverlay({
  crop,
  onStart,
}: {
  crop:
    CropValues;

  onStart: (
    event:
      React.MouseEvent,

    side:
      | "top"
      | "right"
      | "bottom"
      | "left"
  ) => void;
}) {
  return (
    <div
      className="
        absolute
        inset-0
        z-[500]
        pointer-events-none
      "
    >
      {/* CROP RECTANGLE */}

      <div
        style={{
          top: `${crop.top}%`,

          right: `${crop.right}%`,

          bottom: `${crop.bottom}%`,

          left: `${crop.left}%`,

          boxShadow:
            "0 0 0 9999px rgba(0,0,0,0.58)",
        }}
        className="
          absolute
          border-2
          border-white
          pointer-events-none
        "
      >
        {/* RULE OF THIRDS */}

        <div
          className="
            absolute
            left-1/3
            top-0
            bottom-0
            w-px
            bg-white/30
          "
        />

        <div
          className="
            absolute
            left-2/3
            top-0
            bottom-0
            w-px
            bg-white/30
          "
        />

        <div
          className="
            absolute
            top-1/3
            left-0
            right-0
            h-px
            bg-white/30
          "
        />

        <div
          className="
            absolute
            top-2/3
            left-0
            right-0
            h-px
            bg-white/30
          "
        />

        {/* TOP */}

        <button
          onMouseDown={(
            event
          ) =>
            onStart(
              event,
              "top"
            )
          }
          className="
            absolute
            pointer-events-auto
            cursor-ns-resize
            left-1/2
            -translate-x-1/2
            -top-[5px]
            w-14
            h-[10px]
            rounded-full
            bg-white
            border
            border-violet-500
          "
        />

        {/* BOTTOM */}

        <button
          onMouseDown={(
            event
          ) =>
            onStart(
              event,
              "bottom"
            )
          }
          className="
            absolute
            pointer-events-auto
            cursor-ns-resize
            left-1/2
            -translate-x-1/2
            -bottom-[5px]
            w-14
            h-[10px]
            rounded-full
            bg-white
            border
            border-violet-500
          "
        />

        {/* LEFT */}

        <button
          onMouseDown={(
            event
          ) =>
            onStart(
              event,
              "left"
            )
          }
          className="
            absolute
            pointer-events-auto
            cursor-ew-resize
            top-1/2
            -translate-y-1/2
            -left-[5px]
            h-14
            w-[10px]
            rounded-full
            bg-white
            border
            border-violet-500
          "
        />

        {/* RIGHT */}

        <button
          onMouseDown={(
            event
          ) =>
            onStart(
              event,
              "right"
            )
          }
          className="
            absolute
            pointer-events-auto
            cursor-ew-resize
            top-1/2
            -translate-y-1/2
            -right-[5px]
            h-14
            w-[10px]
            rounded-full
            bg-white
            border
            border-violet-500
          "
        />
      </div>
    </div>
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
   NORMAL SELECTION
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
        "
      >
        {label}
      </div>

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

      <button
        onMouseDown={
          onRotateStart
        }
        disabled={
          disabled
        }
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
        disabled:opacity-40
        ${className}
      `}
    />
  );
}