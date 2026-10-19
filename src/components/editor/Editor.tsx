"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  GripHorizontal,
} from "lucide-react";

import TopBar from "./TopBar";
import ToolSidebar from "./ToolSidebar";
import MediaPanel from "./MediaPanel";

import PreviewPanel, {
  ProjectAspectRatio,
} from "./PreviewPanel";

import PropertiesPanel from "./PropertiesPanel";

import Timeline from "./timeline/Timeline";

import {
  useEditor,
} from "@/hooks/useEditor";

import {
  DEFAULT_TIMELINE_HEIGHT,
  MAX_TIMELINE_HEIGHT,
  MIN_TIMELINE_HEIGHT,
} from "@/constants/editor";

export default function Editor() {
  const editor =
    useEditor();

  const [
    projectAspectRatio,
    setProjectAspectRatio,
  ] =
    useState<ProjectAspectRatio>(
      "16:9"
    );

  const [
    cropMode,
    setCropMode,
  ] = useState(false);

  const previousSelectedClipRef =
    useRef<string | null>(
      null
    );

  useEffect(() => {
    if (
      previousSelectedClipRef.current !==
        null &&
      previousSelectedClipRef.current !==
        editor.selectedClipId
    ) {
      setCropMode(
        false
      );
    }

    previousSelectedClipRef.current =
      editor.selectedClipId;
  }, [
    editor.selectedClipId,
  ]);

  const startCrop =
    () => {
      if (
        !editor.selectedClip ||
        editor.selectedClip.kind !==
          "video" ||
        editor.tracksLocked
      ) {
        return;
      }

      editor.setCurrentTime(
        editor.selectedClip.timelineStart
      );

      setCropMode(
        true
      );
    };

  const resetCrop =
    () => {
      if (
        !editor.selectedClip ||
        editor.selectedClip.kind !==
          "video"
      ) {
        return;
      }

      editor.updateSelectedClipTransform(
        {
          cropTop: 0,
          cropRight: 0,
          cropBottom: 0,
          cropLeft: 0,
        }
      );
    };

  /* =====================================
     TIMELINE HEIGHT
  ===================================== */

  const [
    timelineHeight,
    setTimelineHeight,
  ] = useState(
    DEFAULT_TIMELINE_HEIGHT
  );

  const resizeRef =
    useRef<{
      startY:
        number;

      startHeight:
        number;
    } | null>(
      null
    );

  const startWorkspaceResize = (
    event:
      React.MouseEvent
  ) => {
    event.preventDefault();

    resizeRef.current =
      {
        startY:
          event.clientY,

        startHeight:
          timelineHeight,
      };

    document.body.style.cursor =
      "row-resize";

    document.body.style.userSelect =
      "none";
  };

  const resetWorkspaceResize =
    () => {
      setTimelineHeight(
        DEFAULT_TIMELINE_HEIGHT
      );
    };

  useEffect(() => {
    const handleMouseMove = (
      event:
        MouseEvent
    ) => {
      const resize =
        resizeRef.current;

      if (
        !resize
      ) {
        return;
      }

      const delta =
        resize.startY -
        event.clientY;

      const viewportLimit =
        Math.max(
          MIN_TIMELINE_HEIGHT,

          window.innerHeight -
            260
        );

      const maxHeight =
        Math.min(
          MAX_TIMELINE_HEIGHT,

          viewportLimit
        );

      setTimelineHeight(
        Math.max(
          MIN_TIMELINE_HEIGHT,

          Math.min(
            maxHeight,

            resize.startHeight +
              delta
          )
        )
      );
    };

    const handleMouseUp =
      () => {
        resizeRef.current =
          null;

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

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "mouseup",
        handleMouseUp
      );
    };
  }, []);

  return (
    <main
      className="
        h-screen
        overflow-hidden
        bg-[#090B0F]
        text-[#F4F4F5]
        select-none
      "
    >
      <input
        ref={
          editor.fileInputRef
        }
        type="file"
        accept="video/*"
        multiple
        onChange={
          editor.importMedia
        }
        className="hidden"
      />

      <TopBar
        canUndo={
          editor.canUndo
        }
        canRedo={
          editor.canRedo
        }
        onUndo={
          editor.undo
        }
        onRedo={
          editor.redo
        }
      />

      <div
        className="
          flex
          h-[calc(100vh-56px)]
          flex-col
        "
      >
        <div
          className="
            flex
            flex-1
            min-h-0
          "
        >
          <ToolSidebar
            onAddText={
              editor.addTextClip
            }
          />

          <MediaPanel
            mediaItems={
              editor.mediaItems
            }
            isImporting={
              editor.isImporting
            }
            onImport={() =>
              editor
                .fileInputRef
                .current
                ?.click()
            }
            onAddToTrack={
              editor.addMediaToTrack
            }
          />

          <PreviewPanel
            v1VideoRef={
              editor.v1VideoRef
            }

            v2VideoRef={
              editor.v2VideoRef
            }

            activeV1Media={
              editor.activeV1Media
            }

            activeV2Media={
              editor.activeV2Media
            }

            activeV1Clip={
              editor.activeV1Clip
            }

            activeV2Clip={
              editor.activeV2Clip
            }

            activeTextClips={
              editor.activeTextClips
            }

            selectedClipId={
              editor.selectedClipId
            }

            locked={
              editor.tracksLocked
            }

            cropMode={
              cropMode
            }

            v1Visible={
              editor.v1Visible
            }

            v2Visible={
              editor.v2Visible
            }

            audioMuted={
              editor.audioMuted
            }

            isPlaying={
              editor.isPlaying
            }

            currentTime={
              editor.currentTime
            }

            projectDuration={
              editor.projectDuration
            }

            aspectRatio={
              projectAspectRatio
            }

            onAspectRatioChange={
              setProjectAspectRatio
            }

            onTogglePlay={
              editor.togglePlay
            }

            onV1TimeUpdate={
              editor.handleV1TimeUpdate
            }

            onV1LoadedMetadata={
              editor.handleV1LoadedMetadata
            }

            onV2LoadedMetadata={
              editor.handleV2LoadedMetadata
            }

            onSelectClip={
              editor.selectClip
            }

            onBeginTransform={
              editor.beginPreviewTransform
            }

            onPreviewTransform={
              editor.updatePreviewTransform
            }

            onCommitTransform={
              editor.commitPreviewTransform
            }

            onApplyCrop={(
              patch
            ) =>
              editor.updateSelectedClipTransform(
                patch
              )
            }

            onCloseCrop={() =>
              setCropMode(
                false
              )
            }
          />

          <PropertiesPanel
            selectedClip={
              editor.selectedClip
            }

            locked={
              editor.tracksLocked
            }

            cropMode={
              cropMode
            }

            onStartCrop={
              startCrop
            }

            onResetCrop={
              resetCrop
            }

            onTransformChange={
              editor.updateSelectedClipTransform
            }

            onResetTransform={
              editor.resetSelectedClipTransform
            }

            onAudioChange={
              editor.updateSelectedAudio
            }

            onResetAudio={
              editor.resetSelectedAudio
            }

            onTextChange={
              editor.updateSelectedText
            }

            onBringForward={
              editor.bringSelectedForward
            }

            onSendBackward={
              editor.sendSelectedBackward
            }
          />
        </div>

        {/* WORKSPACE DIVIDER */}

        <div
          onMouseDown={
            startWorkspaceResize
          }
          onDoubleClick={
            resetWorkspaceResize
          }
          className="
            relative
            h-[8px]
            shrink-0
            cursor-row-resize
            bg-[#11151B]
            border-y
            border-[#20252D]
            hover:bg-violet-500/10
            z-[80]
          "
        >
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              pointer-events-none
            "
          >
            <GripHorizontal
              size={18}
              className="
                text-white/20
              "
            />
          </div>
        </div>

        <Timeline
          height={
            timelineHeight
          }

          clips={
            editor.timelineClips
          }

          selectedClipId={
            editor.selectedClipId
          }

          currentTime={
            editor.currentTime
          }

          projectDuration={
            editor.projectDuration
          }

          pixelsPerSecond={
            editor.pixelsPerSecond
          }

          zoom={
            editor.zoom
          }

          v1Visible={
            editor.v1Visible
          }

          v2Visible={
            editor.v2Visible
          }

          audioMuted={
            editor.audioMuted
          }

          locked={
            editor.tracksLocked
          }

          v1Height={
            editor.v1Height
          }

          v2Height={
            editor.v2Height
          }

          audioHeight={
            editor.audioHeight
          }

          getFrames={
            editor.getFrames
          }

          getWaveform={
            editor.getWaveform
          }

          onSelectClip={
            editor.selectClip
          }

          onTimelineClick={
            editor.seekTimelineFromMouse
          }

          onDragStart={
            editor.startClipDrag
          }

          onTrimStart={
            editor.startTrim
          }

          onTrackResize={
            editor.startTrackResize
          }

          onSplit={
            editor.splitAtPlayhead
          }

          onDelete={
            editor.deleteSelectedClip
          }

          onRippleDelete={
            editor.rippleDeleteSelectedClip
          }

          onZoomIn={
            editor.zoomIn
          }

          onZoomOut={
            editor.zoomOut
          }

          onToggleV1={() =>
            editor.setV1Visible(
              !editor.v1Visible
            )
          }

          onToggleV2={() =>
            editor.setV2Visible(
              !editor.v2Visible
            )
          }

          onToggleAudio={() =>
            editor.setAudioMuted(
              !editor.audioMuted
            )
          }

          onToggleLock={() =>
            editor.setTracksLocked(
              !editor.tracksLocked
            )
          }
        />
      </div>
    </main>
  );
}