"use client";

import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Type,
  Music2,
  Captions,
  Sparkles,
  Play,
  Pause,
  Scissors,
  Trash2,
  ChevronsLeft,
  Undo2,
  Redo2,
  Eye,
  Lock,
  Volume2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize2,
  SlidersHorizontal,
  MonitorPlay,
  Check,
  Plus,
} from "lucide-react";

type MediaItem = {
  id: string;
  name: string;
  url: string;
  file: File;
  type: "video";
  duration: number;
  thumbnails: string[];
  waveform: number[];
};

type TimelineClip = {
  id: string;
  mediaId: string;
  name: string;
  sourceUrl: string;

  timelineStart: number;
  sourceStart: number;
  duration: number;
};

type DragState = {
  clipId: string;
  startMouseX: number;
  initialTimelineStart: number;
};

type TrimState = {
  clipId: string;
  side: "left" | "right";
  startMouseX: number;
  initialTimelineStart: number;
  initialSourceStart: number;
  initialDuration: number;
};

type PendingPreview = {
  clipId: string;
  timelineTime: number;
  autoplay: boolean;
};

const MIN_CLIP_DURATION = 0.1;
const BASE_PIXELS_PER_SECOND = 20;
const MAX_HISTORY = 50;

function cloneClips(clips: TimelineClip[]) {
  return clips.map((clip) => ({ ...clip }));
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "00:00:00";

  const totalSeconds = Math.floor(seconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function getClipAtTimelineTime(
  clips: TimelineClip[],
  timelineTime: number
) {
  return [...clips]
    .sort((a, b) => a.timelineStart - b.timelineStart)
    .find((clip) => {
      const end = clip.timelineStart + clip.duration;

      return (
        timelineTime >= clip.timelineStart &&
        timelineTime < end
      );
    });
}

function waitForVideoEvent(
  video: HTMLVideoElement,
  eventName: keyof HTMLMediaElementEventMap
) {
  return new Promise<void>((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error(`Video event failed: ${eventName}`));
    };

    const cleanup = () => {
      video.removeEventListener(eventName, onSuccess);
      video.removeEventListener("error", onError);
    };

    video.addEventListener(eventName, onSuccess, {
      once: true,
    });

    video.addEventListener("error", onError, {
      once: true,
    });
  });
}

/* -----------------------------------------------------
   VIDEO THUMBNAILS
----------------------------------------------------- */

async function generateVideoThumbnails(
  url: string,
  count = 10
) {
  const video = document.createElement("video");

  video.src = url;
  video.muted = true;
  video.preload = "auto";

  await waitForVideoEvent(video, "loadedmetadata");

  const duration = video.duration;

  if (!Number.isFinite(duration) || duration <= 0) {
    return [];
  }

  const canvas = document.createElement("canvas");

  canvas.width = 160;
  canvas.height = 90;

  const ctx = canvas.getContext("2d");

  if (!ctx) return [];

  const thumbnails: string[] = [];

  for (let i = 0; i < count; i++) {
    const progress =
      count === 1 ? 0 : i / (count - 1);

    const seekTime = Math.min(
      duration * progress,
      Math.max(0, duration - 0.05)
    );

    video.currentTime = seekTime;

    try {
      await waitForVideoEvent(video, "seeked");

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      thumbnails.push(
        canvas.toDataURL("image/jpeg", 0.6)
      );
    } catch {
      // skip failed frame
    }
  }

  video.removeAttribute("src");
  video.load();

  return thumbnails;
}

/* -----------------------------------------------------
   WAVEFORM
----------------------------------------------------- */

async function generateWaveform(
  file: File,
  sampleCount = 120
) {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const audioContext =
      new AudioContext();

    const audioBuffer =
      await audioContext.decodeAudioData(
        arrayBuffer.slice(0)
      );

    const data =
      audioBuffer.getChannelData(0);

    const blockSize = Math.max(
      1,
      Math.floor(
        data.length / sampleCount
      )
    );

    const waveform: number[] = [];

    for (
      let i = 0;
      i < sampleCount;
      i++
    ) {
      const start =
        i * blockSize;

      const end = Math.min(
        start + blockSize,
        data.length
      );

      let peak = 0;

      for (
        let j = start;
        j < end;
        j++
      ) {
        peak = Math.max(
          peak,
          Math.abs(data[j])
        );
      }

      waveform.push(peak);
    }

    await audioContext.close();

    const max =
      Math.max(...waveform, 0.001);

    return waveform.map(
      (value) => value / max
    );
  } catch {
    /*
      Some codecs/containers may not decode
      directly with Web Audio.
    */
    return [];
  }
}

/* -----------------------------------------------------
   MEDIA INFO
----------------------------------------------------- */

async function processMediaFile(
  file: File
): Promise<MediaItem> {
  const url =
    URL.createObjectURL(file);

  const video =
    document.createElement("video");

  video.src = url;
  video.preload = "metadata";
  video.muted = true;

  await waitForVideoEvent(
    video,
    "loadedmetadata"
  );

  const duration =
    video.duration;

  const [thumbnails, waveform] =
    await Promise.all([
      generateVideoThumbnails(
        url,
        10
      ),

      generateWaveform(
        file,
        120
      ),
    ]);

  video.removeAttribute("src");
  video.load();

  return {
    id: crypto.randomUUID(),
    name: file.name,
    url,
    file,
    type: "video",
    duration,
    thumbnails,
    waveform,
  };
}

export default function Home() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const timelineClipsRef =
    useRef<TimelineClip[]>([]);

  const activePlaybackClipIdRef =
    useRef<string | null>(null);

  const pendingPreviewRef =
    useRef<PendingPreview | null>(
      null
    );

  const dragStateRef =
    useRef<DragState | null>(null);

  const trimStateRef =
    useRef<TrimState | null>(null);

  const operationSnapshotRef =
    useRef<TimelineClip[] | null>(
      null
    );

  const [mediaItems, setMediaItems] =
    useState<MediaItem[]>([]);

  const [selectedMedia, setSelectedMedia] =
    useState<MediaItem | null>(
      null
    );

  const [timelineClips, setTimelineClips] =
    useState<TimelineClip[]>([]);

  const [selectedClipId, setSelectedClipId] =
    useState<string | null>(
      null
    );

  const [currentTime, setCurrentTime] =
    useState(0);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [isImporting, setIsImporting] =
    useState(false);

  const [
    draggingClipId,
    setDraggingClipId,
  ] = useState<string | null>(
    null
  );

  const [
    trimmingClipId,
    setTrimmingClipId,
  ] = useState<string | null>(
    null
  );

  const [zoom, setZoom] =
    useState(100);

  const [past, setPast] =
    useState<TimelineClip[][]>(
      []
    );

  const [future, setFuture] =
    useState<TimelineClip[][]>(
      []
    );

  useEffect(() => {
    timelineClipsRef.current =
      timelineClips;
  }, [timelineClips]);

  const pixelsPerSecond =
    BASE_PIXELS_PER_SECOND *
    (zoom / 100);

  /* -----------------------------------------------------
     MEDIA LOOKUP
  ----------------------------------------------------- */

  const getMediaById = (
    mediaId: string
  ) =>
    mediaItems.find(
      (media) =>
        media.id === mediaId
    );

  /* -----------------------------------------------------
     HISTORY
  ----------------------------------------------------- */

  const pushHistory = (
    snapshot?: TimelineClip[]
  ) => {
    const state =
      snapshot ??
      cloneClips(
        timelineClipsRef.current
      );

    setPast((prev) => [
      ...prev.slice(
        -(MAX_HISTORY - 1)
      ),
      cloneClips(state),
    ]);

    setFuture([]);
  };

  const undo = () => {
    if (!past.length) return;

    const previous =
      past[past.length - 1];

    const current =
      cloneClips(
        timelineClipsRef.current
      );

    setPast((prev) =>
      prev.slice(0, -1)
    );

    setFuture((prev) => [
      current,
      ...prev,
    ]);

    setTimelineClips(
      cloneClips(previous)
    );

    setSelectedClipId(null);

    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const redo = () => {
    if (!future.length) return;

    const next =
      future[0];

    const current =
      cloneClips(
        timelineClipsRef.current
      );

    setFuture((prev) =>
      prev.slice(1)
    );

    setPast((prev) => [
      ...prev.slice(
        -(MAX_HISTORY - 1)
      ),
      current,
    ]);

    setTimelineClips(
      cloneClips(next)
    );

    setSelectedClipId(null);

    videoRef.current?.pause();
    setIsPlaying(false);
  };

  /* -----------------------------------------------------
     IMPORT
  ----------------------------------------------------- */

  const handleImportClick =
    () => {
      fileInputRef.current?.click();
    };

  const handleFileChange =
    async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const files =
        event.target.files;

      if (!files?.length) return;

      const videoFiles =
        Array.from(files).filter(
          (file) =>
            file.type.startsWith(
              "video/"
            )
        );

      if (!videoFiles.length) return;

      setIsImporting(true);

      try {
        for (const file of videoFiles) {
          try {
            const media =
              await processMediaFile(
                file
              );

            setMediaItems(
              (prev) => [
                ...prev,
                media,
              ]
            );

            setSelectedMedia(
              (current) =>
                current ?? media
            );
          } catch (error) {
            console.error(
              "Failed to import:",
              file.name,
              error
            );
          }
        }
      } finally {
        setIsImporting(false);
      }

      event.target.value = "";
    };

  /* -----------------------------------------------------
     PROJECT DURATION
  ----------------------------------------------------- */

  const projectDuration =
    timelineClips.length
      ? Math.max(
          ...timelineClips.map(
            (clip) =>
              clip.timelineStart +
              clip.duration
          )
        )
      : 0;

  /* -----------------------------------------------------
     ADD MEDIA TO TIMELINE
  ----------------------------------------------------- */

  const addMediaToTimeline = (
    media: MediaItem
  ) => {
    pushHistory();

    const newClip: TimelineClip =
      {
        id: crypto.randomUUID(),

        mediaId: media.id,

        name: media.name,

        sourceUrl: media.url,

        timelineStart:
          projectDuration,

        sourceStart: 0,

        duration:
          media.duration,
      };

    setTimelineClips(
      (prev) => [
        ...prev,
        newClip,
      ]
    );

    setSelectedClipId(
      newClip.id
    );

    setSelectedMedia(media);

    setCurrentTime(
      newClip.timelineStart
    );

    pendingPreviewRef.current =
      {
        clipId: newClip.id,

        timelineTime:
          newClip.timelineStart,

        autoplay: false,
      };

    activePlaybackClipIdRef.current =
      newClip.id;
  };

  /* -----------------------------------------------------
     PREVIEW SOURCE SWITCHING
  ----------------------------------------------------- */

  const previewTimelineClip =
    async (
      clip: TimelineClip,
      timelineTime: number,
      autoplay: boolean
    ) => {
      const media =
        getMediaById(
          clip.mediaId
        );

      if (!media) return;

      const video =
        videoRef.current;

      const sourceTime =
        clip.sourceStart +
        Math.max(
          0,
          timelineTime -
            clip.timelineStart
        );

      activePlaybackClipIdRef.current =
        clip.id;

      setCurrentTime(
        timelineTime
      );

      /*
        If another source video needs loading,
        save desired seek/play action.
      */

      if (
        selectedMedia?.id !==
        media.id
      ) {
        pendingPreviewRef.current =
          {
            clipId: clip.id,
            timelineTime,
            autoplay,
          };

        setSelectedMedia(
          media
        );

        return;
      }

      if (!video) return;

      video.currentTime =
        sourceTime;

      if (autoplay) {
        try {
          await video.play();
        } catch {}
      }
    };

  /* -----------------------------------------------------
     WHEN PREVIEW VIDEO SOURCE LOADS
  ----------------------------------------------------- */

  const handleLoadedMetadata =
    async () => {
      const video =
        videoRef.current;

      if (!video) return;

      const pending =
        pendingPreviewRef.current;

      if (!pending) return;

      const clip =
        timelineClipsRef.current.find(
          (item) =>
            item.id ===
            pending.clipId
        );

      if (!clip) {
        pendingPreviewRef.current =
          null;

        return;
      }

      const offset =
        pending.timelineTime -
        clip.timelineStart;

      video.currentTime =
        clip.sourceStart +
        Math.max(0, offset);

      activePlaybackClipIdRef.current =
        clip.id;

      setCurrentTime(
        pending.timelineTime
      );

      const autoplay =
        pending.autoplay;

      pendingPreviewRef.current =
        null;

      if (autoplay) {
        try {
          await video.play();
        } catch {}
      }
    };

  /* -----------------------------------------------------
     PLAY
  ----------------------------------------------------- */

  const togglePlay =
    async () => {
      const video =
        videoRef.current;

      if (!timelineClips.length)
        return;

      if (
        video &&
        !video.paused
      ) {
        video.pause();
        return;
      }

      let targetTime =
        currentTime;

      if (
        targetTime >=
        projectDuration
      ) {
        targetTime = 0;
      }

      let clip =
        getClipAtTimelineTime(
          timelineClips,
          targetTime
        );

      if (!clip) {
        clip = [
          ...timelineClips,
        ]
          .sort(
            (a, b) =>
              a.timelineStart -
              b.timelineStart
          )
          .find(
            (item) =>
              item.timelineStart >=
              targetTime
          );
      }

      if (!clip) return;

      await previewTimelineClip(
        clip,
        Math.max(
          targetTime,
          clip.timelineStart
        ),
        true
      );
    };

  /* -----------------------------------------------------
     PLAYBACK UPDATE
  ----------------------------------------------------- */

  const handlePreviewTimeUpdate =
    () => {
      const video =
        videoRef.current;

      if (!video) return;

      const activeClip =
        timelineClipsRef.current.find(
          (clip) =>
            clip.id ===
            activePlaybackClipIdRef.current
        );

      if (!activeClip)
        return;

      const sourceEnd =
        activeClip.sourceStart +
        activeClip.duration;

      /*
        Still inside this clip.
      */

      if (
        video.currentTime <
        sourceEnd - 0.04
      ) {
        const offset =
          video.currentTime -
          activeClip.sourceStart;

        setCurrentTime(
          activeClip.timelineStart +
            Math.max(0, offset)
        );

        return;
      }

      /*
        Clip ended → next timeline clip.
      */

      const timelineEnd =
        activeClip.timelineStart +
        activeClip.duration;

      const sorted = [
        ...timelineClipsRef.current,
      ].sort(
        (a, b) =>
          a.timelineStart -
          b.timelineStart
      );

      const nextClip =
        sorted.find(
          (clip) =>
            clip.id !==
              activeClip.id &&
            clip.timelineStart >=
              timelineEnd - 0.01
        );

      if (nextClip) {
        previewTimelineClip(
          nextClip,
          nextClip.timelineStart,
          true
        );

        return;
      }

      video.pause();

      setIsPlaying(false);

      setCurrentTime(
        timelineEnd
      );
    };

  /* -----------------------------------------------------
     TIMELINE SEEK
  ----------------------------------------------------- */

  const handleTimelineClick =
    (
      event: React.MouseEvent<HTMLDivElement>
    ) => {
      if (
        draggingClipId ||
        trimmingClipId
      )
        return;

      const rect =
        event.currentTarget.getBoundingClientRect();

      const clickedTime =
        (event.clientX -
          rect.left) /
        pixelsPerSecond;

      const safeTime =
        Math.min(
          Math.max(
            clickedTime,
            0
          ),
          projectDuration
        );

      videoRef.current?.pause();

      setIsPlaying(false);

      setCurrentTime(
        safeTime
      );

      setSelectedClipId(
        null
      );

      const clip =
        getClipAtTimelineTime(
          timelineClips,
          safeTime
        );

      if (!clip) {
        activePlaybackClipIdRef.current =
          null;

        return;
      }

      previewTimelineClip(
        clip,
        safeTime,
        false
      );
    };

  /* -----------------------------------------------------
     SPLIT
  ----------------------------------------------------- */

  const handleSplit =
    () => {
      const clips =
        timelineClipsRef.current;

      const splitTime =
        currentTime;

      const index =
        clips.findIndex(
          (clip) => {
            const end =
              clip.timelineStart +
              clip.duration;

            return (
              splitTime >
                clip.timelineStart +
                  0.05 &&
              splitTime <
                end - 0.05
            );
          }
        );

      if (index === -1)
        return;

      pushHistory();

      const clip =
        clips[index];

      const leftDuration =
        splitTime -
        clip.timelineStart;

      const rightDuration =
        clip.duration -
        leftDuration;

      const leftClip: TimelineClip =
        {
          ...clip,

          id: crypto.randomUUID(),

          duration:
            leftDuration,
        };

      const rightClip: TimelineClip =
        {
          ...clip,

          id: crypto.randomUUID(),

          timelineStart:
            splitTime,

          sourceStart:
            clip.sourceStart +
            leftDuration,

          duration:
            rightDuration,
        };

      const updated =
        cloneClips(clips);

      updated.splice(
        index,
        1,
        leftClip,
        rightClip
      );

      setTimelineClips(
        updated
      );

      setSelectedClipId(
        rightClip.id
      );

      activePlaybackClipIdRef.current =
        rightClip.id;
    };

  /* -----------------------------------------------------
     DELETE
  ----------------------------------------------------- */

  const deleteSelectedClip =
    () => {
      if (!selectedClipId)
        return;

      pushHistory();

      videoRef.current?.pause();

      setIsPlaying(false);

      setTimelineClips(
        (prev) =>
          prev.filter(
            (clip) =>
              clip.id !==
              selectedClipId
          )
      );

      setSelectedClipId(
        null
      );
    };

  const rippleDeleteSelectedClip =
    () => {
      if (!selectedClipId)
        return;

      pushHistory();

      videoRef.current?.pause();

      setIsPlaying(false);

      setTimelineClips(
        (prev) => {
          const deleted =
            prev.find(
              (clip) =>
                clip.id ===
                selectedClipId
            );

          if (!deleted)
            return prev;

          return prev
            .filter(
              (clip) =>
                clip.id !==
                selectedClipId
            )
            .map((clip) => {
              if (
                clip.timelineStart >
                deleted.timelineStart
              ) {
                return {
                  ...clip,

                  timelineStart:
                    Math.max(
                      0,

                      clip.timelineStart -
                        deleted.duration
                    ),
                };
              }

              return clip;
            });
        }
      );

      setSelectedClipId(
        null
      );
    };

  /* -----------------------------------------------------
     MAGNETIC SNAP
  ----------------------------------------------------- */

  const getSnappedStart = (
    clipId: string,
    proposedStart: number,
    duration: number
  ) => {
    const snapThreshold =
      10 /
      pixelsPerSecond;

    const snapPoints = [0];

    timelineClipsRef.current.forEach(
      (clip) => {
        if (
          clip.id === clipId
        )
          return;

        snapPoints.push(
          clip.timelineStart
        );

        snapPoints.push(
          clip.timelineStart +
            clip.duration
        );
      }
    );

    let bestStart =
      proposedStart;

    let bestDistance =
      snapThreshold;

    const proposedEnd =
      proposedStart +
      duration;

    snapPoints.forEach(
      (point) => {
        const startDistance =
          Math.abs(
            proposedStart -
              point
          );

        if (
          startDistance <
          bestDistance
        ) {
          bestDistance =
            startDistance;

          bestStart =
            point;
        }

        const endDistance =
          Math.abs(
            proposedEnd -
              point
          );

        if (
          endDistance <
          bestDistance
        ) {
          bestDistance =
            endDistance;

          bestStart =
            point -
            duration;
        }
      }
    );

    return Math.max(
      0,
      bestStart
    );
  };

  /* -----------------------------------------------------
     DRAG
  ----------------------------------------------------- */

  const startClipDrag =
    (
      event: React.MouseEvent,
      clip: TimelineClip
    ) => {
      event.stopPropagation();

      videoRef.current?.pause();

      setIsPlaying(false);

      setSelectedClipId(
        clip.id
      );

      setDraggingClipId(
        clip.id
      );

      operationSnapshotRef.current =
        cloneClips(
          timelineClipsRef.current
        );

      dragStateRef.current =
        {
          clipId: clip.id,

          startMouseX:
            event.clientX,

          initialTimelineStart:
            clip.timelineStart,
        };
    };

  /* -----------------------------------------------------
     TRIM
  ----------------------------------------------------- */

  const startTrim =
    (
      event: React.MouseEvent,
      clip: TimelineClip,
      side: "left" | "right"
    ) => {
      event.stopPropagation();

      event.preventDefault();

      videoRef.current?.pause();

      setIsPlaying(false);

      setSelectedClipId(
        clip.id
      );

      setTrimmingClipId(
        clip.id
      );

      operationSnapshotRef.current =
        cloneClips(
          timelineClipsRef.current
        );

      trimStateRef.current =
        {
          clipId: clip.id,

          side,

          startMouseX:
            event.clientX,

          initialTimelineStart:
            clip.timelineStart,

          initialSourceStart:
            clip.sourceStart,

          initialDuration:
            clip.duration,
        };
    };

  /* -----------------------------------------------------
     DRAG / TRIM GLOBAL
  ----------------------------------------------------- */

  useEffect(() => {
    const handleMouseMove =
      (event: MouseEvent) => {
        const drag =
          dragStateRef.current;

        if (drag) {
          const clip =
            timelineClipsRef.current.find(
              (item) =>
                item.id ===
                drag.clipId
            );

          if (!clip) return;

          const deltaSeconds =
            (event.clientX -
              drag.startMouseX) /
            pixelsPerSecond;

          const proposedStart =
            Math.max(
              0,

              drag.initialTimelineStart +
                deltaSeconds
            );

          const snappedStart =
            getSnappedStart(
              drag.clipId,

              proposedStart,

              clip.duration
            );

          setTimelineClips(
            (prev) =>
              prev.map(
                (item) =>
                  item.id ===
                  drag.clipId
                    ? {
                        ...item,

                        timelineStart:
                          snappedStart,
                      }
                    : item
              )
          );

          return;
        }

        const trim =
          trimStateRef.current;

        if (!trim) return;

        const deltaSeconds =
          (event.clientX -
            trim.startMouseX) /
          pixelsPerSecond;

        const activeClip =
          timelineClipsRef.current.find(
            (clip) =>
              clip.id ===
              trim.clipId
          );

        if (!activeClip)
          return;

        const media =
          mediaItems.find(
            (item) =>
              item.id ===
              activeClip.mediaId
          );

        if (trim.side === "left") {
          let delta =
            deltaSeconds;

          delta = Math.max(
            delta,
            -trim.initialSourceStart
          );

          delta = Math.min(
            delta,

            trim.initialDuration -
              MIN_CLIP_DURATION
          );

          const newTimelineStart =
            Math.max(
              0,

              trim.initialTimelineStart +
                delta
            );

          const actualDelta =
            newTimelineStart -
            trim.initialTimelineStart;

          const newSourceStart =
            trim.initialSourceStart +
            actualDelta;

          const newDuration =
            trim.initialDuration -
            actualDelta;

          setTimelineClips(
            (prev) =>
              prev.map(
                (clip) =>
                  clip.id ===
                  trim.clipId
                    ? {
                        ...clip,

                        timelineStart:
                          newTimelineStart,

                        sourceStart:
                          Math.max(
                            0,

                            newSourceStart
                          ),

                        duration:
                          Math.max(
                            MIN_CLIP_DURATION,

                            newDuration
                          ),
                      }
                    : clip
              )
          );
        }

        if (
          trim.side === "right"
        ) {
          let newDuration =
            trim.initialDuration +
            deltaSeconds;

          newDuration =
            Math.max(
              MIN_CLIP_DURATION,

              newDuration
            );

          if (media) {
            const maxDuration =
              media.duration -
              trim.initialSourceStart;

            newDuration =
              Math.min(
                newDuration,

                maxDuration
              );
          }

          setTimelineClips(
            (prev) =>
              prev.map(
                (clip) =>
                  clip.id ===
                  trim.clipId
                    ? {
                        ...clip,

                        duration:
                          newDuration,
                      }
                    : clip
              )
          );
        }
      };

    const handleMouseUp =
      () => {
        if (
          operationSnapshotRef.current
        ) {
          const oldState =
            operationSnapshotRef.current;

          const changed =
            JSON.stringify(
              oldState
            ) !==
            JSON.stringify(
              timelineClipsRef.current
            );

          if (changed) {
            pushHistory(
              oldState
            );
          }
        }

        operationSnapshotRef.current =
          null;

        dragStateRef.current =
          null;

        trimStateRef.current =
          null;

        setDraggingClipId(
          null
        );

        setTrimmingClipId(
          null
        );
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
  }, [
    pixelsPerSecond,
    mediaItems,
  ]);

  /* -----------------------------------------------------
     ZOOM
  ----------------------------------------------------- */

  const zoomIn =
    () => {
      setZoom((prev) =>
        Math.min(
          300,
          prev + 25
        )
      );
    };

  const zoomOut =
    () => {
      setZoom((prev) =>
        Math.max(
          50,
          prev - 25
        )
      );
    };

  /* -----------------------------------------------------
     SHORTCUTS
  ----------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown =
      (
        event: KeyboardEvent
      ) => {
        const target =
          event.target as HTMLElement;

        const typing =
          target.tagName ===
            "INPUT" ||
          target.tagName ===
            "TEXTAREA" ||
          target.isContentEditable;

        if (typing) return;

        if (
          event.ctrlKey &&
          event.shiftKey &&
          event.key.toLowerCase() ===
            "z"
        ) {
          event.preventDefault();

          redo();

          return;
        }

        if (
          event.ctrlKey &&
          event.key.toLowerCase() ===
            "z"
        ) {
          event.preventDefault();

          undo();

          return;
        }

        if (
          event.key.toLowerCase() ===
          "s"
        ) {
          event.preventDefault();

          handleSplit();

          return;
        }

        if (
          event.code ===
          "Space"
        ) {
          event.preventDefault();

          togglePlay();

          return;
        }

        if (
          event.key ===
            "Delete" ||
          event.key ===
            "Backspace"
        ) {
          event.preventDefault();

          deleteSelectedClip();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [
    past,
    future,
    selectedClipId,
    currentTime,
    timelineClips,
    projectDuration,
    selectedMedia,
    mediaItems,
  ]);

  /* -----------------------------------------------------
     TIMELINE VISUALS
  ----------------------------------------------------- */

  const timelineWidth =
    Math.max(
      projectDuration *
        pixelsPerSecond,
      900
    );

  const playheadPosition =
    currentTime *
    pixelsPerSecond;

  const rulerSeconds =
    Math.max(
      45,

      Math.ceil(
        projectDuration + 10
      )
    );

  const rulerMarks: number[] =
    [];

  for (
    let time = 0;
    time <= rulerSeconds;
    time += 5
  ) {
    rulerMarks.push(time);
  }

  /* -----------------------------------------------------
     FRAME STRIP
  ----------------------------------------------------- */

  const getFramesForClip = (
    clip: TimelineClip,
    width: number
  ) => {
    const media =
      getMediaById(
        clip.mediaId
      );

    if (
      !media ||
      !media.thumbnails.length ||
      !media.duration
    ) {
      return [];
    }

    const frameCount =
      Math.max(
        1,

        Math.min(
          15,

          Math.ceil(
            width / 70
          )
        )
      );

    return Array.from(
      {
        length: frameCount,
      },

      (_, index) => {
        const progress =
          frameCount === 1
            ? 0
            : index /
              (frameCount - 1);

        const sourceTime =
          clip.sourceStart +
          clip.duration *
            progress;

        const normalized =
          Math.min(
            1,

            Math.max(
              0,

              sourceTime /
                media.duration
            )
          );

        const thumbIndex =
          Math.round(
            normalized *
              (media.thumbnails
                .length -
                1)
          );

        return media
          .thumbnails[
          thumbIndex
        ];
      }
    );
  };

  /* -----------------------------------------------------
     WAVEFORM FOR CLIP
  ----------------------------------------------------- */

  const getWaveformForClip = (
    clip: TimelineClip,
    width: number
  ) => {
    const media =
      getMediaById(
        clip.mediaId
      );

    if (
      !media ||
      !media.waveform.length ||
      !media.duration
    ) {
      return [];
    }

    const barCount =
      Math.max(
        5,

        Math.min(
          100,

          Math.floor(
            width / 4
          )
        )
      );

    return Array.from(
      {
        length: barCount,
      },

      (_, index) => {
        const progress =
          barCount === 1
            ? 0
            : index /
              (barCount - 1);

        const sourceTime =
          clip.sourceStart +
          clip.duration *
            progress;

        const normalized =
          Math.min(
            1,

            Math.max(
              0,

              sourceTime /
                media.duration
            )
          );

        const waveformIndex =
          Math.round(
            normalized *
              (media.waveform
                .length -
                1)
          );

        return (
          media.waveform[
            waveformIndex
          ] ?? 0
        );
      }
    );
  };

  return (
    <main className="h-screen overflow-hidden bg-[#090B0F] text-[#F4F4F5] select-none">

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={
          handleFileChange
        }
        className="hidden"
      />

      {/* TOP BAR */}

      <header className="h-14 border-b border-[#222630] bg-[#0D1015] flex items-center justify-between px-4">

        <div className="flex items-center gap-3">

          <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center font-bold">
            C
          </div>

          <span className="font-semibold">
            CUTX
          </span>

        </div>

        <div className="flex items-center gap-3">

          <input
            defaultValue="Untitled Project"
            className="bg-transparent text-sm text-center outline-none border-b border-transparent focus:border-violet-400"
          />

          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <Check size={13} />
            Saved
          </div>

        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={undo}
            disabled={!past.length}
            className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/50 disabled:opacity-20"
          >
            <Undo2 size={17} />
          </button>

          <button
            onClick={redo}
            disabled={!future.length}
            className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/50 disabled:opacity-20"
          >
            <Redo2 size={17} />
          </button>

          <button className="bg-violet-500 hover:bg-violet-400 px-5 py-2 rounded-lg text-sm font-semibold">
            Export
          </button>

        </div>

      </header>

      <div className="flex h-[calc(100vh-56px)] flex-col">

        {/* WORKSPACE */}

        <div className="flex flex-1 min-h-0">

          {/* LEFT TOOLBAR */}

          <aside className="w-[74px] border-r border-[#222630] bg-[#0D1015] py-3 flex flex-col items-center gap-1">

            {[
              {
                label: "Media",
                icon: Upload,
              },
              {
                label: "Text",
                icon: Type,
              },
              {
                label: "Audio",
                icon: Music2,
              },
              {
                label: "Captions",
                icon: Captions,
              },
              {
                label: "Effects",
                icon: Sparkles,
              },
            ].map(
              (item, index) => {
                const Icon =
                  item.icon;

                return (
                  <button
                    key={
                      item.label
                    }
                    className={`w-[58px] py-2.5 rounded-xl flex flex-col items-center gap-1 ${
                      index === 0
                        ? "bg-violet-500/15 text-violet-300"
                        : "text-white/45 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={18}
                    />

                    <span className="text-[10px]">
                      {
                        item.label
                      }
                    </span>
                  </button>
                );
              }
            )}

          </aside>

          {/* MEDIA LIBRARY */}

          <section className="w-[290px] border-r border-[#222630] bg-[#101319] p-4 overflow-y-auto">

            <div className="flex justify-between items-center mb-4">

              <h2 className="text-sm font-semibold">
                Media
              </h2>

              <span className="text-[10px] text-white/30">
                {mediaItems.length} files
              </span>

            </div>

            <button
              onClick={
                handleImportClick
              }
              disabled={
                isImporting
              }
              className="w-full h-24 rounded-xl border border-dashed border-[#323846] bg-[#12161D] hover:border-violet-500/50 flex flex-col items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload
                size={20}
                className="text-violet-300"
              />

              <span className="text-xs">
                {isImporting
                  ? "Analyzing media..."
                  : "Import media"}
              </span>

              <span className="text-[10px] text-white/25">
                Local processing
              </span>
            </button>

            <div className="grid grid-cols-2 gap-3 mt-4">

              {mediaItems.map(
                (item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      setSelectedMedia(
                        item
                      )
                    }
                    className={`overflow-hidden rounded-xl border transition cursor-pointer ${
                      selectedMedia?.id ===
                      item.id
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-[#282D36] bg-[#151920] hover:border-[#3A404C]"
                    }`}
                  >

                    <div className="aspect-video bg-black relative overflow-hidden">

                      {item.thumbnails[0] ? (
                        <img
                          src={
                            item
                              .thumbnails[0]
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MonitorPlay
                            size={22}
                            className="text-white/25"
                          />
                        </div>
                      )}

                      <span className="absolute right-1 bottom-1 bg-black/75 rounded px-1 text-[8px]">
                        {formatTime(
                          item.duration
                        )}
                      </span>

                    </div>

                    <div className="p-2">

                      <p className="text-[10px] truncate">
                        {item.name}
                      </p>

                      <button
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          addMediaToTimeline(
                            item
                          );
                        }}
                        className="mt-2 w-full h-6 rounded-md bg-violet-500/15 hover:bg-violet-500/30 text-violet-200 flex items-center justify-center gap-1 text-[9px]"
                      >
                        <Plus size={11} />
                        Timeline
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

          </section>

          {/* PREVIEW */}

          <section className="flex-1 min-w-0 bg-[#090B0F] flex flex-col">

            <div className="flex-1 min-h-0 flex items-center justify-center px-8 py-6 overflow-hidden">

              <div
                className="
                  aspect-video
                  w-auto
                  h-[calc(100%-24px)]
                  max-w-[calc(100%-32px)]
                  max-h-[430px]
                  bg-black
                  rounded-xl
                  border border-[#242933]
                  shadow-2xl
                  shadow-black/40
                  overflow-hidden
                "
              >

                {selectedMedia ? (
                  <video
                    ref={videoRef}
                    key={
                      selectedMedia.id
                    }
                    src={
                      selectedMedia.url
                    }
                    onLoadedMetadata={
                      handleLoadedMetadata
                    }
                    onTimeUpdate={
                      handlePreviewTimeUpdate
                    }
                    onPlay={() =>
                      setIsPlaying(
                        true
                      )
                    }
                    onPause={() =>
                      setIsPlaying(
                        false
                      )
                    }
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/25">
                    <MonitorPlay
                      size={36}
                    />

                    <span className="text-xs">
                      Import media to begin
                    </span>
                  </div>
                )}

              </div>

            </div>

            <div className="h-12 border-t border-[#1D222B] flex items-center justify-center gap-5">

              <span className="text-xs text-white/40 tabular-nums">
                {formatTime(
                  currentTime
                )}
              </span>

              <button
                onClick={
                  togglePlay
                }
                disabled={
                  !timelineClips.length
                }
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-30"
              >

                {isPlaying ? (
                  <Pause size={15} />
                ) : (
                  <Play
                    size={15}
                    fill="currentColor"
                  />
                )}

              </button>

              <span className="text-xs text-white/40 tabular-nums">
                {formatTime(
                  projectDuration
                )}
              </span>

            </div>

          </section>

          {/* PROPERTIES */}

          <aside className="w-[290px] border-l border-[#222630] bg-[#101319] overflow-y-auto">

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

            <div className="p-4 space-y-6">

              <div>

                <div className="flex items-center gap-2 mb-4">
                  <Move size={14} />
                  <span className="text-xs">
                    Transform
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">

                  <input
                    placeholder="X"
                    className="bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs"
                  />

                  <input
                    placeholder="Y"
                    className="bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs"
                  />

                </div>

                <div className="mt-4">

                  <div className="flex gap-2 mb-2 text-[10px] text-white/40">
                    <Maximize2 size={12} />
                    Scale
                  </div>

                  <input
                    defaultValue="100%"
                    className="w-full bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs"
                  />

                </div>

                <div className="mt-4">

                  <div className="flex gap-2 mb-2 text-[10px] text-white/40">
                    <RotateCw size={12} />
                    Rotation
                  </div>

                  <input
                    defaultValue="0°"
                    className="w-full bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs"
                  />

                </div>

              </div>

              <div className="border-t border-[#222630] pt-5">

                <div className="flex gap-2 mb-3 text-xs">
                  <SlidersHorizontal
                    size={14}
                  />
                  Opacity
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="100"
                  className="w-full accent-violet-500"
                />

              </div>

            </div>

          </aside>

        </div>

        {/* TIMELINE */}

        <section className="h-[300px] border-t border-[#222630] bg-[#0D1015] overflow-hidden">

          {/* TIMELINE TOOLBAR */}

          <div className="h-11 border-b border-[#222630] px-4 flex items-center gap-2">

            <button
              onClick={
                handleSplit
              }
              className="h-8 px-3 rounded-lg flex gap-2 items-center text-xs hover:bg-white/5"
            >
              <Scissors size={14} />
              Split
            </button>

            <button
              onClick={
                deleteSelectedClip
              }
              disabled={
                !selectedClipId
              }
              className="h-8 px-3 rounded-lg flex gap-2 items-center text-xs hover:bg-white/5 disabled:opacity-30"
            >
              <Trash2 size={14} />
              Delete
            </button>

            <button
              onClick={
                rippleDeleteSelectedClip
              }
              disabled={
                !selectedClipId
              }
              className="h-8 px-3 rounded-lg flex gap-2 items-center text-xs hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronsLeft size={14} />
              Ripple
            </button>

            <span className="ml-4 text-xs text-white/40 tabular-nums">
              {formatTime(
                currentTime
              )}
            </span>

            <div className="ml-auto flex items-center gap-2">

              <button
                onClick={
                  zoomOut
                }
                className="w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded-md"
              >
                <ZoomOut size={14} />
              </button>

              <span className="text-[10px] w-10 text-center text-white/50">
                {zoom}%
              </span>

              <button
                onClick={
                  zoomIn
                }
                className="w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded-md"
              >
                <ZoomIn size={14} />
              </button>

            </div>

          </div>

          {/* RULER */}

          <div className="h-7 border-b border-[#20252E] relative">

            {rulerMarks.map(
              (time) => (
                <span
                  key={time}
                  className="absolute bottom-1 text-[9px] text-white/25"
                  style={{
                    left: `${
                      88 +
                      time *
                        pixelsPerSecond
                    }px`,
                  }}
                >
                  {time}s
                </span>
              )
            )}

          </div>

          {/* TRACK AREA */}

          <div className="h-[calc(100%-72px)] overflow-x-auto overflow-y-hidden">

            <div
              className="relative min-h-full"
              style={{
                width: `${
                  timelineWidth +
                  120
                }px`,
              }}
            >

              {/* PLAYHEAD */}

              {timelineClips.length >
                0 && (
                <div
                  className="absolute top-0 bottom-0 z-50 pointer-events-none"
                  style={{
                    left: `${
                      88 +
                      playheadPosition
                    }px`,
                  }}
                >
                  <div className="w-px h-full bg-violet-400" />

                  <div className="absolute -top-[3px] -left-[4px] w-2.5 h-2.5 rotate-45 bg-violet-400 rounded-sm" />
                </div>
              )}

              {/* VIDEO TRACK */}

              <div className="h-[70px] flex border-b border-[#171B21]">

                <div className="w-[88px] flex-shrink-0 border-r border-[#222630] bg-[#101319] flex items-center px-3">

                  <span className="text-[10px]">
                    V1
                  </span>

                  <Eye
                    size={12}
                    className="ml-auto opacity-30"
                  />

                  <Lock
                    size={11}
                    className="ml-2 opacity-30"
                  />

                </div>

                <div
                  onClick={
                    handleTimelineClick
                  }
                  className="relative flex-1 bg-[#0B0E13]"
                >

                  {timelineClips.map(
                    (clip) => {
                      const left =
                        clip.timelineStart *
                        pixelsPerSecond;

                      const width =
                        clip.duration *
                        pixelsPerSecond;

                      const selected =
                        selectedClipId ===
                        clip.id;

                      const frames =
                        getFramesForClip(
                          clip,
                          width
                        );

                      return (
                        <div
                          key={clip.id}
                          onMouseDown={(
                            event
                          ) =>
                            startClipDrag(
                              event,
                              clip
                            )
                          }
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            setSelectedClipId(
                              clip.id
                            );

                            previewTimelineClip(
                              clip,
                              clip.timelineStart,
                              false
                            );
                          }}
                          className={`absolute top-1 h-[62px] rounded-md overflow-hidden cursor-grab ${
                            selected
                              ? "border-2 border-violet-300"
                              : "border border-violet-500/40"
                          }`}
                          style={{
                            left: `${left}px`,

                            width: `${Math.max(
                              width,
                              4
                            )}px`,
                          }}
                        >

                          {/* FRAME STRIP */}

                          <div className="absolute inset-0 flex bg-[#181222]">

                            {frames.map(
                              (
                                frame,
                                index
                              ) => (
                                <img
                                  key={
                                    index
                                  }
                                  src={
                                    frame
                                  }
                                  alt=""
                                  draggable={
                                    false
                                  }
                                  className="h-full min-w-0 flex-1 object-cover opacity-75"
                                />
                              )
                            )}

                          </div>

                          {/* PURPLE TINT */}

                          <div className="absolute inset-0 bg-violet-600/15" />

                          {/* CLIP NAME */}

                          <span className="absolute left-2 top-1 px-1 py-[2px] rounded bg-black/60 text-[9px] max-w-[70%] truncate pointer-events-none">
                            {clip.name}
                          </span>

                          {/* LEFT TRIM */}

                          <div
                            onMouseDown={(
                              event
                            ) =>
                              startTrim(
                                event,
                                clip,
                                "left"
                              )
                            }
                            className={`absolute left-0 top-0 bottom-0 w-[5px] cursor-ew-resize z-20 ${
                              selected
                                ? "bg-violet-200"
                                : ""
                            }`}
                          />

                          {/* RIGHT TRIM */}

                          <div
                            onMouseDown={(
                              event
                            ) =>
                              startTrim(
                                event,
                                clip,
                                "right"
                              )
                            }
                            className={`absolute right-0 top-0 bottom-0 w-[5px] cursor-ew-resize z-20 ${
                              selected
                                ? "bg-violet-200"
                                : ""
                            }`}
                          />

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              {/* AUDIO TRACK */}

              <div className="h-[64px] flex border-b border-[#171B21]">

                <div className="w-[88px] flex-shrink-0 border-r border-[#222630] bg-[#101319] flex items-center px-3">

                  <span className="text-[10px]">
                    A1
                  </span>

                  <Volume2
                    size={12}
                    className="ml-auto opacity-30"
                  />

                  <Lock
                    size={11}
                    className="ml-2 opacity-30"
                  />

                </div>

                <div className="relative flex-1 bg-[#0B0E13]">

                  {timelineClips.map(
                    (clip) => {
                      const left =
                        clip.timelineStart *
                        pixelsPerSecond;

                      const width =
                        clip.duration *
                        pixelsPerSecond;

                      const waveform =
                        getWaveformForClip(
                          clip,
                          width
                        );

                      return (
                        <div
                          key={`audio-${clip.id}`}
                          className="absolute top-1 h-[56px] rounded-md overflow-hidden bg-violet-500/10 border border-violet-500/20"
                          style={{
                            left: `${left}px`,

                            width: `${Math.max(
                              width,
                              4
                            )}px`,
                          }}
                        >

                          {waveform.length ? (
                            <div className="absolute inset-0 flex items-center gap-[1px] px-[2px]">

                              {waveform.map(
                                (
                                  value,
                                  index
                                ) => (
                                  <div
                                    key={
                                      index
                                    }
                                    className="flex-1 min-w-[1px] max-w-[3px] bg-violet-300/70 rounded-full"
                                    style={{
                                      height: `${Math.max(
                                        3,
                                        value *
                                          45
                                      )}px`,
                                    }}
                                  />
                                )
                              )}

                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-white/20">
                              Audio
                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}