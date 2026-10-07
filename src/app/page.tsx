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
  EyeOff,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize2,
  SlidersHorizontal,
  MonitorPlay,
  Check,
  Plus,
  Link2,
  GripHorizontal,
  Layers3,
} from "lucide-react";

type VideoTrack = "V1" | "V2";

type MediaItem = {
  id: string;
  name: string;
  url: string;
  file: File;
  duration: number;
  thumbnails: string[];
  waveform: number[];
};

type TimelineClip = {
  id: string;

  mediaId: string;

  name: string;

  sourceUrl: string;

  track: VideoTrack;

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

type TrackResizeState = {
  track: "V1" | "V2" | "A1";

  startMouseY: number;

  initialHeight: number;
};

const MIN_CLIP_DURATION = 0.1;

const BASE_PIXELS_PER_SECOND = 20;

const MAX_HISTORY = 50;

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function cloneClips(clips: TimelineClip[]) {
  return clips.map((clip) => ({
    ...clip,
  }));
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "00:00:00";
  }

  const totalSeconds =
    Math.floor(seconds);

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const secs =
    totalSeconds % 60;

  return `${hours
    .toString()
    .padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function getClipAtTime(
  clips: TimelineClip[],
  timelineTime: number,
  track?: VideoTrack
) {
  return [...clips]
    .filter(
      (clip) =>
        !track ||
        clip.track === track
    )
    .sort(
      (a, b) =>
        a.timelineStart -
        b.timelineStart
    )
    .find((clip) => {
      const end =
        clip.timelineStart +
        clip.duration;

      return (
        timelineTime >=
          clip.timelineStart &&
        timelineTime < end
      );
    });
}

function waitForVideoEvent(
  video: HTMLVideoElement,

  eventName: keyof HTMLMediaElementEventMap
) {
  return new Promise<void>(
    (resolve, reject) => {
      const success = () => {
        cleanup();

        resolve();
      };

      const error = () => {
        cleanup();

        reject(
          new Error(
            `Video event failed: ${eventName}`
          )
        );
      };

      const cleanup = () => {
        video.removeEventListener(
          eventName,
          success
        );

        video.removeEventListener(
          "error",
          error
        );
      };

      video.addEventListener(
        eventName,
        success,
        {
          once: true,
        }
      );

      video.addEventListener(
        "error",
        error,
        {
          once: true,
        }
      );
    }
  );
}

/* -------------------------------------------------------
   THUMBNAILS
------------------------------------------------------- */

async function generateVideoThumbnails(
  url: string,

  count = 12
) {
  const video =
    document.createElement("video");

  video.src = url;

  video.muted = true;

  video.preload = "auto";

  await waitForVideoEvent(
    video,
    "loadedmetadata"
  );

  const duration =
    video.duration;

  if (
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return [];
  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 160;

  canvas.height = 90;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) return [];

  const thumbnails: string[] =
    [];

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const progress =
      count === 1
        ? 0
        : i / (count - 1);

    video.currentTime =
      Math.min(
        duration * progress,

        Math.max(
          0,
          duration - 0.05
        )
      );

    try {
      await waitForVideoEvent(
        video,
        "seeked"
      );

      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      thumbnails.push(
        canvas.toDataURL(
          "image/jpeg",
          0.6
        )
      );
    } catch {}
  }

  video.removeAttribute("src");

  video.load();

  return thumbnails;
}

/* -------------------------------------------------------
   WAVEFORM
------------------------------------------------------- */

async function generateWaveform(
  file: File,

  sampleCount = 160
) {
  try {
    const arrayBuffer =
      await file.arrayBuffer();

    const audioContext =
      new AudioContext();

    const audioBuffer =
      await audioContext.decodeAudioData(
        arrayBuffer.slice(0)
      );

    const data =
      audioBuffer.getChannelData(0);

    const blockSize =
      Math.max(
        1,

        Math.floor(
          data.length /
            sampleCount
        )
      );

    const waveform: number[] =
      [];

    for (
      let i = 0;
      i < sampleCount;
      i++
    ) {
      const start =
        i * blockSize;

      const end =
        Math.min(
          start + blockSize,
          data.length
        );

      let peak = 0;

      for (
        let j = start;
        j < end;
        j++
      ) {
        peak =
          Math.max(
            peak,
            Math.abs(data[j])
          );
      }

      waveform.push(peak);
    }

    await audioContext.close();

    const max =
      Math.max(
        ...waveform,
        0.001
      );

    return waveform.map(
      (value) =>
        value / max
    );
  } catch {
    return [];
  }
}

/* -------------------------------------------------------
   PROCESS MEDIA
------------------------------------------------------- */

async function processMediaFile(
  file: File
): Promise<MediaItem> {
  const url =
    URL.createObjectURL(file);

  const video =
    document.createElement(
      "video"
    );

  video.src = url;

  video.preload =
    "metadata";

  video.muted = true;

  await waitForVideoEvent(
    video,
    "loadedmetadata"
  );

  const duration =
    video.duration;

  const [
    thumbnails,
    waveform,
  ] = await Promise.all([
    generateVideoThumbnails(
      url,
      12
    ),

    generateWaveform(
      file,
      160
    ),
  ]);

  video.removeAttribute("src");

  video.load();

  return {
    id: crypto.randomUUID(),

    name: file.name,

    url,

    file,

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

  /*
    V1 = main playback/master audio
    V2 = muted overlay
  */

  const v1VideoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const v2VideoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const timelineClipsRef =
    useRef<TimelineClip[]>([]);

  const dragStateRef =
    useRef<DragState | null>(
      null
    );

  const trimStateRef =
    useRef<TrimState | null>(
      null
    );

  const resizeStateRef =
    useRef<TrackResizeState | null>(
      null
    );

  const operationSnapshotRef =
    useRef<TimelineClip[] | null>(
      null
    );

  const activeV1ClipRef =
    useRef<string | null>(
      null
    );

  const activeV2ClipRef =
    useRef<string | null>(
      null
    );

  const [
    mediaItems,
    setMediaItems,
  ] = useState<MediaItem[]>(
    []
  );

  const [
    timelineClips,
    setTimelineClips,
  ] = useState<
    TimelineClip[]
  >([]);

  const [
    selectedClipId,
    setSelectedClipId,
  ] = useState<string | null>(
    null
  );

  const [
    currentTime,
    setCurrentTime,
  ] = useState(0);

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);

  const [
    isImporting,
    setIsImporting,
  ] = useState(false);

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

  const [
    activeV1Media,
    setActiveV1Media,
  ] = useState<MediaItem | null>(
    null
  );

  const [
    activeV2Media,
    setActiveV2Media,
  ] = useState<MediaItem | null>(
    null
  );

  const [
    zoom,
    setZoom,
  ] = useState(100);

  const [
    past,
    setPast,
  ] = useState<
    TimelineClip[][]
  >([]);

  const [
    future,
    setFuture,
  ] = useState<
    TimelineClip[][]
  >([]);

  const [
    v1Height,
    setV1Height,
  ] = useState(84);

  const [
    v2Height,
    setV2Height,
  ] = useState(70);

  const [
    audioHeight,
    setAudioHeight,
  ] = useState(70);

  const [
    v1Visible,
    setV1Visible,
  ] = useState(true);

  const [
    v2Visible,
    setV2Visible,
  ] = useState(true);

  const [
    audioMuted,
    setAudioMuted,
  ] = useState(false);

  const [
    tracksLocked,
    setTracksLocked,
  ] = useState(false);

  useEffect(() => {
    timelineClipsRef.current =
      timelineClips;
  }, [timelineClips]);

  const pixelsPerSecond =
    BASE_PIXELS_PER_SECOND *
    (zoom / 100);

  /* -------------------------------------------------------
     LOOKUP
  ------------------------------------------------------- */

  const getMediaById = (
    id: string
  ) =>
    mediaItems.find(
      (item) =>
        item.id === id
    );

  /* -------------------------------------------------------
     HISTORY
  ------------------------------------------------------- */

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
    if (!past.length)
      return;

    const previous =
      past[past.length - 1];

    setFuture((prev) => [
      cloneClips(
        timelineClipsRef.current
      ),
      ...prev,
    ]);

    setPast((prev) =>
      prev.slice(0, -1)
    );

    setTimelineClips(
      cloneClips(previous)
    );

    setSelectedClipId(null);

    pauseAll();
  };

  const redo = () => {
    if (!future.length)
      return;

    const next =
      future[0];

    setPast((prev) => [
      ...prev,

      cloneClips(
        timelineClipsRef.current
      ),
    ]);

    setFuture((prev) =>
      prev.slice(1)
    );

    setTimelineClips(
      cloneClips(next)
    );

    setSelectedClipId(null);

    pauseAll();
  };

  /* -------------------------------------------------------
     IMPORT
  ------------------------------------------------------- */

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

      if (!files?.length)
        return;

      const videoFiles =
        Array.from(files).filter(
          (file) =>
            file.type.startsWith(
              "video/"
            )
        );

      if (!videoFiles.length)
        return;

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
          } catch (error) {
            console.error(
              error
            );
          }
        }
      } finally {
        setIsImporting(false);
      }

      event.target.value = "";
    };

  /* -------------------------------------------------------
     PROJECT
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     ADD TO TRACK
  ------------------------------------------------------- */

  const addMediaToTrack = (
    media: MediaItem,
    track: VideoTrack
  ) => {
    pushHistory();

    /*
      V1:
      append to end.

      V2:
      place at current playhead.
    */

    const timelineStart =
      track === "V1"
        ? Math.max(
            0,
            ...timelineClips
              .filter(
                (clip) =>
                  clip.track ===
                  "V1"
              )
              .map(
                (clip) =>
                  clip.timelineStart +
                  clip.duration
              )
          )
        : currentTime;

    const clip: TimelineClip =
      {
        id: crypto.randomUUID(),

        mediaId: media.id,

        name: media.name,

        sourceUrl:
          media.url,

        track,

        timelineStart,

        sourceStart: 0,

        duration:
          media.duration,
      };

    setTimelineClips(
      (prev) => [
        ...prev,
        clip,
      ]
    );

    setSelectedClipId(
      clip.id
    );

    setCurrentTime(
      timelineStart
    );

    seekTimeline(
      timelineStart,
      false
    );
  };

  /* -------------------------------------------------------
     PAUSE
  ------------------------------------------------------- */

  const pauseAll = () => {
    v1VideoRef.current?.pause();

    v2VideoRef.current?.pause();

    setIsPlaying(false);
  };

  /* -------------------------------------------------------
     LOAD VIDEO SOURCE
  ------------------------------------------------------- */

  const ensureTrackSource =
    async (
      clip: TimelineClip
    ) => {
      const media =
        getMediaById(
          clip.mediaId
        );

      if (!media)
        return null;

      const isV1 =
        clip.track === "V1";

      const ref =
        isV1
          ? v1VideoRef.current
          : v2VideoRef.current;

      if (!ref)
        return null;

      const currentMedia =
        isV1
          ? activeV1Media
          : activeV2Media;

      if (
        currentMedia?.id !==
        media.id
      ) {
        if (isV1) {
          setActiveV1Media(
            media
          );
        } else {
          setActiveV2Media(
            media
          );
        }

        return null;
      }

      return ref;
    };

  /* -------------------------------------------------------
     SYNC OVERLAY
  ------------------------------------------------------- */

  const syncV2ToTime =
    async (
      timelineTime: number,
      autoplay: boolean
    ) => {
      if (!v2Visible) {
        v2VideoRef.current?.pause();

        activeV2ClipRef.current =
          null;

        return;
      }

      const clip =
        getClipAtTime(
          timelineClipsRef.current,

          timelineTime,

          "V2"
        );

      if (!clip) {
        v2VideoRef.current?.pause();

        activeV2ClipRef.current =
          null;

        return;
      }

      const media =
        getMediaById(
          clip.mediaId
        );

      if (!media)
        return;

      activeV2ClipRef.current =
        clip.id;

      if (
        activeV2Media?.id !==
        media.id
      ) {
        setActiveV2Media(
          media
        );

        return;
      }

      const video =
        v2VideoRef.current;

      if (!video)
        return;

      const target =
        clip.sourceStart +
        timelineTime -
        clip.timelineStart;

      if (
        Math.abs(
          video.currentTime -
            target
        ) > 0.12
      ) {
        video.currentTime =
          target;
      }

      if (
        autoplay &&
        video.paused
      ) {
        try {
          video.muted = true;

          await video.play();
        } catch {}
      }
    };

  /* -------------------------------------------------------
     SEEK TIMELINE
  ------------------------------------------------------- */

  const seekTimeline =
    async (
      timelineTime: number,
      autoplay: boolean
    ) => {
      const safe =
        Math.max(
          0,
          Math.min(
            timelineTime,
            projectDuration
          )
        );

      setCurrentTime(safe);

      const v1Clip =
        getClipAtTime(
          timelineClipsRef.current,

          safe,

          "V1"
        );

      if (v1Clip) {
        const media =
          getMediaById(
            v1Clip.mediaId
          );

        if (media) {
          activeV1ClipRef.current =
            v1Clip.id;

          if (
            activeV1Media?.id !==
            media.id
          ) {
            setActiveV1Media(
              media
            );
          } else {
            const video =
              v1VideoRef.current;

            if (video) {
              video.currentTime =
                v1Clip.sourceStart +
                safe -
                v1Clip.timelineStart;

              video.muted =
                audioMuted;

              if (autoplay) {
                try {
                  await video.play();
                } catch {}
              }
            }
          }
        }
      } else {
        v1VideoRef.current?.pause();

        activeV1ClipRef.current =
          null;
      }

      await syncV2ToTime(
        safe,
        autoplay
      );
    };

  /* -------------------------------------------------------
     SOURCE LOAD COMPLETE
  ------------------------------------------------------- */

  const handleV1Loaded =
    async () => {
      const clip =
        getClipAtTime(
          timelineClipsRef.current,

          currentTime,

          "V1"
        );

      if (!clip)
        return;

      const video =
        v1VideoRef.current;

      if (!video)
        return;

      activeV1ClipRef.current =
        clip.id;

      video.currentTime =
        clip.sourceStart +
        currentTime -
        clip.timelineStart;

      video.muted =
        audioMuted;

      if (isPlaying) {
        try {
          await video.play();
        } catch {}
      }
    };

  const handleV2Loaded =
    async () => {
      const clip =
        getClipAtTime(
          timelineClipsRef.current,

          currentTime,

          "V2"
        );

      if (!clip)
        return;

      const video =
        v2VideoRef.current;

      if (!video)
        return;

      activeV2ClipRef.current =
        clip.id;

      video.muted = true;

      video.currentTime =
        clip.sourceStart +
        currentTime -
        clip.timelineStart;

      if (isPlaying) {
        try {
          await video.play();
        } catch {}
      }
    };

  /* -------------------------------------------------------
     MASTER PLAYBACK
  ------------------------------------------------------- */

  const togglePlay =
    async () => {
      if (!timelineClips.length)
        return;

      if (isPlaying) {
        pauseAll();

        return;
      }

      let start =
        currentTime;

      if (
        start >=
        projectDuration
      ) {
        start = 0;

        setCurrentTime(0);
      }

      setIsPlaying(true);

      await seekTimeline(
        start,
        true
      );
    };

  /* -------------------------------------------------------
     V1 MASTER TIME UPDATE
  ------------------------------------------------------- */

  const handleV1TimeUpdate =
    () => {
      const video =
        v1VideoRef.current;

      if (!video)
        return;

      const activeClip =
        timelineClipsRef.current.find(
          (clip) =>
            clip.id ===
            activeV1ClipRef.current
        );

      if (!activeClip)
        return;

      const offset =
        video.currentTime -
        activeClip.sourceStart;

      const timelineTime =
        activeClip.timelineStart +
        Math.max(
          0,
          offset
        );

      const clipEnd =
        activeClip.timelineStart +
        activeClip.duration;

      if (
        timelineTime <
        clipEnd - 0.04
      ) {
        setCurrentTime(
          timelineTime
        );

        syncV2ToTime(
          timelineTime,
          true
        );

        return;
      }

      /*
        Find next V1 clip.
      */

      const next =
        [...timelineClipsRef.current]
          .filter(
            (clip) =>
              clip.track ===
              "V1" &&
              clip.id !==
                activeClip.id
          )
          .sort(
            (a, b) =>
              a.timelineStart -
              b.timelineStart
          )
          .find(
            (clip) =>
              clip.timelineStart >=
              clipEnd - 0.01
          );

      if (next) {
        seekTimeline(
          next.timelineStart,
          true
        );

        return;
      }

      pauseAll();

      setCurrentTime(
        clipEnd
      );
    };

  /* -------------------------------------------------------
     CLICK TIMELINE
  ------------------------------------------------------- */

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

      const time =
        (event.clientX -
          rect.left) /
        pixelsPerSecond;

      pauseAll();

      setSelectedClipId(
        null
      );

      seekTimeline(
        time,
        false
      );
    };

  /* -------------------------------------------------------
     SPLIT SELECTED/TOP CLIP
  ------------------------------------------------------- */

  const handleSplit =
    () => {
      if (tracksLocked)
        return;

      const clips =
        timelineClipsRef.current;

      /*
        Prefer selected clip.
        Otherwise V2, then V1.
      */

      let index = -1;

      if (selectedClipId) {
        index =
          clips.findIndex(
            (clip) =>
              clip.id ===
              selectedClipId &&
              currentTime >
                clip.timelineStart +
                  0.05 &&
              currentTime <
                clip.timelineStart +
                  clip.duration -
                  0.05
          );
      }

      if (index === -1) {
        index =
          clips.findIndex(
            (clip) =>
              currentTime >
                clip.timelineStart +
                  0.05 &&
              currentTime <
                clip.timelineStart +
                  clip.duration -
                  0.05
          );
      }

      if (index === -1)
        return;

      pushHistory();

      const clip =
        clips[index];

      const leftDuration =
        currentTime -
        clip.timelineStart;

      const rightDuration =
        clip.duration -
        leftDuration;

      const left: TimelineClip =
        {
          ...clip,

          id: crypto.randomUUID(),

          duration:
            leftDuration,
        };

      const right: TimelineClip =
        {
          ...clip,

          id: crypto.randomUUID(),

          timelineStart:
            currentTime,

          sourceStart:
            clip.sourceStart +
            leftDuration,

          duration:
            rightDuration,
        };

      const next =
        cloneClips(clips);

      next.splice(
        index,
        1,
        left,
        right
      );

      setTimelineClips(next);

      setSelectedClipId(
        right.id
      );
    };

  /* -------------------------------------------------------
     DELETE
  ------------------------------------------------------- */

  const deleteSelectedClip =
    () => {
      if (
        !selectedClipId ||
        tracksLocked
      )
        return;

      pushHistory();

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

      pauseAll();
    };

  const rippleDeleteSelectedClip =
    () => {
      if (
        !selectedClipId ||
        tracksLocked
      )
        return;

      const deleted =
        timelineClipsRef.current.find(
          (clip) =>
            clip.id ===
            selectedClipId
        );

      if (!deleted)
        return;

      pushHistory();

      setTimelineClips(
        (prev) =>
          prev
            .filter(
              (clip) =>
                clip.id !==
                deleted.id
            )
            .map((clip) => {
              /*
                Ripple only clips
                on same track.
              */

              if (
                clip.track ===
                  deleted.track &&
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
            })
      );

      setSelectedClipId(
        null
      );

      pauseAll();
    };

  /* -------------------------------------------------------
     SNAP
  ------------------------------------------------------- */

  const getSnappedStart = (
    clipId: string,

    proposed: number,

    duration: number
  ) => {
    const threshold =
      10 /
      pixelsPerSecond;

    const points = [0];

    timelineClipsRef.current.forEach(
      (clip) => {
        if (
          clip.id === clipId
        )
          return;

        points.push(
          clip.timelineStart
        );

        points.push(
          clip.timelineStart +
            clip.duration
        );
      }
    );

    let best =
      proposed;

    let distance =
      threshold;

    const proposedEnd =
      proposed + duration;

    points.forEach((point) => {
      const startDistance =
        Math.abs(
          proposed - point
        );

      if (
        startDistance <
        distance
      ) {
        distance =
          startDistance;

        best =
          point;
      }

      const endDistance =
        Math.abs(
          proposedEnd - point
        );

      if (
        endDistance <
        distance
      ) {
        distance =
          endDistance;

        best =
          point - duration;
      }
    });

    return Math.max(0, best);
  };

  /* -------------------------------------------------------
     DRAG
  ------------------------------------------------------- */

  const startClipDrag = (
    event: React.MouseEvent,

    clip: TimelineClip
  ) => {
    if (tracksLocked)
      return;

    event.stopPropagation();

    pauseAll();

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

  /* -------------------------------------------------------
     TRIM
  ------------------------------------------------------- */

  const startTrim = (
    event: React.MouseEvent,

    clip: TimelineClip,

    side: "left" | "right"
  ) => {
    if (tracksLocked)
      return;

    event.stopPropagation();

    event.preventDefault();

    pauseAll();

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

  /* -------------------------------------------------------
     RESIZE TRACK
  ------------------------------------------------------- */

  const startTrackResize = (
    event: React.MouseEvent,

    track:
      | "V1"
      | "V2"
      | "A1",

    height: number
  ) => {
    resizeStateRef.current =
      {
        track,

        startMouseY:
          event.clientY,

        initialHeight:
          height,
      };
  };

  /* -------------------------------------------------------
     GLOBAL MOUSE
  ------------------------------------------------------- */

  useEffect(() => {
    const mouseMove =
      (event: MouseEvent) => {
        /* TRACK HEIGHT */

        const resize =
          resizeStateRef.current;

        if (resize) {
          const delta =
            event.clientY -
            resize.startMouseY;

          const height =
            Math.min(
              180,

              Math.max(
                44,

                resize.initialHeight +
                  delta
              )
            );

          if (
            resize.track ===
            "V1"
          ) {
            setV1Height(height);
          }

          if (
            resize.track ===
            "V2"
          ) {
            setV2Height(height);
          }

          if (
            resize.track ===
            "A1"
          ) {
            setAudioHeight(
              height
            );
          }

          return;
        }

        /* DRAG */

        const drag =
          dragStateRef.current;

        if (drag) {
          const clip =
            timelineClipsRef.current.find(
              (item) =>
                item.id ===
                drag.clipId
            );

          if (!clip)
            return;

          const delta =
            (event.clientX -
              drag.startMouseX) /
            pixelsPerSecond;

          const proposed =
            Math.max(
              0,

              drag.initialTimelineStart +
                delta
            );

          const snapped =
            getSnappedStart(
              clip.id,

              proposed,

              clip.duration
            );

          setTimelineClips(
            (prev) =>
              prev.map(
                (item) =>
                  item.id ===
                  clip.id
                    ? {
                        ...item,

                        timelineStart:
                          snapped,
                      }
                    : item
              )
          );

          return;
        }

        /* TRIM */

        const trim =
          trimStateRef.current;

        if (!trim)
          return;

        const clip =
          timelineClipsRef.current.find(
            (item) =>
              item.id ===
              trim.clipId
          );

        if (!clip)
          return;

        const media =
          getMediaById(
            clip.mediaId
          );

        const delta =
          (event.clientX -
            trim.startMouseX) /
          pixelsPerSecond;

        if (
          trim.side === "left"
        ) {
          let allowed =
            Math.max(
              delta,

              -trim.initialSourceStart
            );

          allowed =
            Math.min(
              allowed,

              trim.initialDuration -
                MIN_CLIP_DURATION
            );

          const newStart =
            Math.max(
              0,

              trim.initialTimelineStart +
                allowed
            );

          const actual =
            newStart -
            trim.initialTimelineStart;

          setTimelineClips(
            (prev) =>
              prev.map(
                (item) =>
                  item.id ===
                  trim.clipId
                    ? {
                        ...item,

                        timelineStart:
                          newStart,

                        sourceStart:
                          Math.max(
                            0,

                            trim.initialSourceStart +
                              actual
                          ),

                        duration:
                          Math.max(
                            MIN_CLIP_DURATION,

                            trim.initialDuration -
                              actual
                          ),
                      }
                    : item
              )
          );
        } else {
          let duration =
            Math.max(
              MIN_CLIP_DURATION,

              trim.initialDuration +
                delta
            );

          if (media) {
            duration =
              Math.min(
                duration,

                media.duration -
                  trim.initialSourceStart
              );
          }

          setTimelineClips(
            (prev) =>
              prev.map(
                (item) =>
                  item.id ===
                  trim.clipId
                    ? {
                        ...item,

                        duration,
                      }
                    : item
              )
          );
        }
      };

    const mouseUp = () => {
      resizeStateRef.current =
        null;

      if (
        operationSnapshotRef.current
      ) {
        const old =
          operationSnapshotRef.current;

        const changed =
          JSON.stringify(old) !==
          JSON.stringify(
            timelineClipsRef.current
          );

        if (changed) {
          pushHistory(old);
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
      mouseMove
    );

    window.addEventListener(
      "mouseup",
      mouseUp
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        mouseMove
      );

      window.removeEventListener(
        "mouseup",
        mouseUp
      );
    };
  }, [
    pixelsPerSecond,
    mediaItems,
  ]);

  /* -------------------------------------------------------
     SHORTCUTS
  ------------------------------------------------------- */

  useEffect(() => {
    const keyboard =
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

        if (typing)
          return;

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
          event.code === "Space"
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
      keyboard
    );

    return () =>
      window.removeEventListener(
        "keydown",
        keyboard
      );
  }, [
    past,
    future,
    selectedClipId,
    currentTime,
    timelineClips,
    projectDuration,
    activeV1Media,
    activeV2Media,
    isPlaying,
    tracksLocked,
  ]);

  /* -------------------------------------------------------
     VISUAL HELPERS
  ------------------------------------------------------- */

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
      !media.thumbnails.length
    ) {
      return [];
    }

    const count =
      Math.max(
        1,

        Math.min(
          18,

          Math.ceil(
            width / 65
          )
        )
      );

    return Array.from(
      {
        length: count,
      },

      (_, index) => {
        const progress =
          count === 1
            ? 0
            : index /
              (count - 1);

        const source =
          clip.sourceStart +
          clip.duration *
            progress;

        const normalized =
          Math.min(
            1,

            Math.max(
              0,

              source /
                media.duration
            )
          );

        const thumb =
          Math.round(
            normalized *
              (media.thumbnails
                .length -
                1)
          );

        return media
          .thumbnails[
          thumb
        ];
      }
    );
  };

  const getWaveform = (
    clip: TimelineClip,

    width: number
  ) => {
    const media =
      getMediaById(
        clip.mediaId
      );

    if (
      !media ||
      !media.waveform.length
    ) {
      return [];
    }

    const count =
      Math.max(
        5,

        Math.min(
          150,

          Math.floor(
            width / 4
          )
        )
      );

    return Array.from(
      {
        length: count,
      },

      (_, index) => {
        const progress =
          count === 1
            ? 0
            : index /
              (count - 1);

        const source =
          clip.sourceStart +
          clip.duration *
            progress;

        const normalized =
          Math.min(
            1,

            Math.max(
              0,

              source /
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

  const timelineWidth =
    Math.max(
      projectDuration *
        pixelsPerSecond,

      900
    );

  const playhead =
    currentTime *
    pixelsPerSecond;

  const rulerMarks: number[] =
    [];

  const rulerEnd =
    Math.max(
      45,

      Math.ceil(
        projectDuration + 10
      )
    );

  for (
    let i = 0;
    i <= rulerEnd;
    i += 5
  ) {
    rulerMarks.push(i);
  }

  /* -------------------------------------------------------
     CLIP RENDERER
  ------------------------------------------------------- */

  const renderVideoClips = (
    track: VideoTrack,

    trackHeight: number
  ) =>
    timelineClips
      .filter(
        (clip) =>
          clip.track === track
      )
      .map((clip) => {
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
            onMouseDown={(event) =>
              startClipDrag(
                event,
                clip
              )
            }
            onClick={(event) => {
              event.stopPropagation();

              setSelectedClipId(
                clip.id
              );

              pauseAll();

              seekTimeline(
                clip.timelineStart,
                false
              );
            }}
            className={`absolute top-1 bottom-1 overflow-hidden rounded-md ${
              tracksLocked
                ? "cursor-default"
                : "cursor-grab active:cursor-grabbing"
            } ${
              selected
                ? "border-2 border-violet-200"
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
            <div className="absolute inset-0 flex bg-[#181222]">
              {frames.map(
                (
                  frame,
                  index
                ) => (
                  <img
                    key={index}
                    src={frame}
                    alt=""
                    draggable={false}
                    className="h-full flex-1 min-w-0 object-cover opacity-80"
                  />
                )
              )}
            </div>

            <div className="absolute inset-0 bg-violet-600/10" />

            <span className="absolute left-2 top-1 z-10 rounded bg-black/65 px-1.5 py-[2px] text-[9px] max-w-[70%] truncate">
              {clip.name}
            </span>

            {!tracksLocked && (
              <>
                <div
                  onMouseDown={(event) =>
                    startTrim(
                      event,
                      clip,
                      "left"
                    )
                  }
                  className={`absolute left-0 top-0 bottom-0 z-20 w-[6px] cursor-ew-resize ${
                    selected
                      ? "bg-violet-100"
                      : ""
                  }`}
                />

                <div
                  onMouseDown={(event) =>
                    startTrim(
                      event,
                      clip,
                      "right"
                    )
                  }
                  className={`absolute right-0 top-0 bottom-0 z-20 w-[6px] cursor-ew-resize ${
                    selected
                      ? "bg-violet-100"
                      : ""
                  }`}
                />
              </>
            )}
          </div>
        );
      });

  return (
    <main className="h-screen bg-[#090B0F] text-[#F4F4F5] overflow-hidden select-none">
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

      <header className="h-14 shrink-0 border-b border-[#222630] bg-[#0D1015] flex items-center justify-between px-4">
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
            className="bg-transparent text-sm text-center outline-none"
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
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-20"
          >
            <Undo2 size={17} />
          </button>

          <button
            onClick={redo}
            disabled={!future.length}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-20"
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
          {/* TOOLS */}

          <aside className="w-[74px] shrink-0 border-r border-[#222630] bg-[#0D1015] py-3 flex flex-col items-center gap-1">
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
              (item, i) => {
                const Icon =
                  item.icon;

                return (
                  <button
                    key={
                      item.label
                    }
                    className={`w-[58px] py-2.5 rounded-xl flex flex-col items-center gap-1 ${
                      i === 0
                        ? "bg-violet-500/15 text-violet-300"
                        : "text-white/45 hover:bg-white/5"
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

          {/* MEDIA */}

          <section className="w-[300px] shrink-0 border-r border-[#222630] bg-[#101319] p-4 overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-sm font-semibold">
                Media
              </h2>

              <span className="text-[10px] text-white/30">
                {
                  mediaItems.length
                }{" "}
                files
              </span>
            </div>

            <button
              onClick={
                handleImportClick
              }
              disabled={
                isImporting
              }
              className="w-full h-24 rounded-xl border border-dashed border-[#323846] flex flex-col items-center justify-center gap-2"
            >
              <Upload
                size={20}
                className="text-violet-300"
              />

              <span className="text-xs">
                {isImporting
                  ? "Analyzing..."
                  : "Import media"}
              </span>

              <span className="text-[10px] text-white/25">
                Local processing
              </span>
            </button>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {mediaItems.map(
                (media) => (
                  <div
                    key={media.id}
                    className="rounded-xl overflow-hidden border border-[#282D36] bg-[#151920]"
                  >
                    <div className="aspect-video bg-black relative">
                      {media
                        .thumbnails[0] ? (
                        <img
                          src={
                            media
                              .thumbnails[0]
                          }
                          alt=""
                          draggable={
                            false
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MonitorPlay
                            size={22}
                          />
                        </div>
                      )}

                      <span className="absolute bottom-1 right-1 text-[8px] bg-black/70 px-1 rounded">
                        {formatTime(
                          media.duration
                        )}
                      </span>
                    </div>

                    <div className="p-2">
                      <p className="text-[10px] truncate">
                        {
                          media.name
                        }
                      </p>

                      <div className="grid grid-cols-2 gap-1 mt-2">
                        <button
                          onClick={() =>
                            addMediaToTrack(
                              media,
                              "V1"
                            )
                          }
                          className="h-6 rounded bg-violet-500/15 hover:bg-violet-500/30 text-[9px] text-violet-200"
                        >
                          + V1
                        </button>

                        <button
                          onClick={() =>
                            addMediaToTrack(
                              media,
                              "V2"
                            )
                          }
                          className="h-6 rounded bg-blue-500/15 hover:bg-blue-500/30 text-[9px] text-blue-200"
                        >
                          + V2
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* PREVIEW */}

          <section className="flex-1 min-w-0 flex flex-col bg-[#090B0F]">
            <div className="flex-1 min-h-0 flex items-center justify-center px-8 py-6">
              <div className="relative aspect-video h-[calc(100%-24px)] max-h-[430px] max-w-[calc(100%-32px)] bg-black rounded-xl overflow-hidden border border-[#242933]">
                {/* V1 */}

                {activeV1Media && (
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
                    onLoadedMetadata={
                      handleV1Loaded
                    }
                    onTimeUpdate={
                      handleV1TimeUpdate
                    }
                    muted={
                      audioMuted
                    }
                    className={`absolute inset-0 w-full h-full object-contain ${
                      v1Visible
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                )}

                {/* V2 OVERLAY */}

                {activeV2Media &&
                  activeV2ClipRef.current && (
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
                      onLoadedMetadata={
                        handleV2Loaded
                      }
                      muted
                      className={`absolute inset-0 z-10 w-full h-full object-contain ${
                        v2Visible
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                  )}

                {!activeV1Media &&
                  !activeV2Media && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/25">
                      Import and add media
                    </div>
                  )}
              </div>
            </div>

            <div className="h-12 shrink-0 border-t border-[#1D222B] flex items-center justify-center gap-5">
              <span className="text-xs text-white/40">
                {formatTime(
                  currentTime
                )}
              </span>

              <button
                onClick={
                  togglePlay
                }
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"
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

              <span className="text-xs text-white/40">
                {formatTime(
                  projectDuration
                )}
              </span>
            </div>
          </section>

          {/* PROPERTIES */}

          <aside className="w-[290px] shrink-0 border-l border-[#222630] bg-[#101319] overflow-y-auto">
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

            <div className="p-4 space-y-5">
              <div className="flex items-center gap-2 text-xs">
                <Move
                  size={14}
                />
                Transform
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

              <div>
                <div className="text-[10px] text-white/40 mb-2 flex gap-2">
                  <Maximize2
                    size={12}
                  />
                  Scale
                </div>

                <input
                  defaultValue="100%"
                  className="w-full bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <div className="text-[10px] text-white/40 mb-2 flex gap-2">
                  <RotateCw
                    size={12}
                  />
                  Rotation
                </div>

                <input
                  defaultValue="0°"
                  className="w-full bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs"
                />
              </div>

              <div className="border-t border-[#222630] pt-5">
                <div className="flex gap-2 text-xs mb-3">
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

        <section className="h-[360px] min-h-[360px] shrink-0 flex flex-col border-t border-[#222630] bg-[#0D1015]">
          {/* TOOLBAR */}

          <div className="h-11 shrink-0 border-b border-[#222630] px-4 flex items-center gap-2">
            <button
              onClick={
                handleSplit
              }
              className="h-8 px-3 flex gap-2 items-center text-xs rounded hover:bg-white/5"
            >
              <Scissors
                size={14}
              />
              Split
            </button>

            <button
              onClick={
                deleteSelectedClip
              }
              disabled={
                !selectedClipId
              }
              className="h-8 px-3 flex gap-2 items-center text-xs rounded hover:bg-white/5 disabled:opacity-30"
            >
              <Trash2
                size={14}
              />
              Delete
            </button>

            <button
              onClick={
                rippleDeleteSelectedClip
              }
              disabled={
                !selectedClipId
              }
              className="h-8 px-3 flex gap-2 items-center text-xs rounded hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronsLeft
                size={14}
              />
              Ripple
            </button>

            <div className="h-5 w-px bg-[#2A3039]" />

            <Layers3
              size={13}
              className="text-white/40"
            />

            <span className="text-[10px] text-white/40">
              V2 overlays V1
            </span>

            <span className="ml-4 text-xs text-white/40">
              {formatTime(
                currentTime
              )}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() =>
                  setZoom((z) =>
                    Math.max(
                      50,
                      z - 25
                    )
                  )
                }
              >
                <ZoomOut
                  size={14}
                />
              </button>

              <span className="text-[10px] w-10 text-center">
                {zoom}%
              </span>

              <button
                onClick={() =>
                  setZoom((z) =>
                    Math.min(
                      300,
                      z + 25
                    )
                  )
                }
              >
                <ZoomIn
                  size={14}
                />
              </button>
            </div>
          </div>

          {/* RULER */}

          <div className="h-7 shrink-0 relative border-b border-[#20252E]">
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

          {/* TRACKS */}

          <div className="flex-1 min-h-0 overflow-auto">
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

              <div
                className="absolute top-0 bottom-0 z-50 pointer-events-none"
                style={{
                  left: `${
                    88 +
                    playhead
                  }px`,
                }}
              >
                <div className="w-px h-full bg-violet-400" />

                <div className="absolute -top-[3px] -left-[4px] w-2.5 h-2.5 bg-violet-400 rotate-45 rounded-sm" />
              </div>

              {/* V2 */}

              <div
                className="flex border-b border-[#171B21]"
                style={{
                  height: `${v2Height}px`,
                }}
              >
                <div className="w-[88px] shrink-0 bg-[#101319] border-r border-[#222630] flex items-center px-3">
                  <span className="text-[10px] text-blue-300">
                    V2
                  </span>

                  <button
                    onClick={() =>
                      setV2Visible(
                        (v) => !v
                      )
                    }
                    className="ml-auto"
                  >
                    {v2Visible ? (
                      <Eye
                        size={12}
                      />
                    ) : (
                      <EyeOff
                        size={12}
                      />
                    )}
                  </button>
                </div>

                <div
                  onClick={
                    handleTimelineClick
                  }
                  className="relative flex-1 bg-[#0B0E13]"
                >
                  {renderVideoClips(
                    "V2",
                    v2Height
                  )}
                </div>
              </div>

              <div
                onMouseDown={(
                  event
                ) =>
                  startTrackResize(
                    event,
                    "V2",
                    v2Height
                  )
                }
                className="h-[5px] ml-[88px] cursor-row-resize hover:bg-violet-500/20"
              />

              {/* V1 */}

              <div
                className="flex border-b border-[#171B21]"
                style={{
                  height: `${v1Height}px`,
                }}
              >
                <div className="w-[88px] shrink-0 bg-[#101319] border-r border-[#222630] flex items-center px-3">
                  <span className="text-[10px]">
                    V1
                  </span>

                  <button
                    onClick={() =>
                      setV1Visible(
                        (v) => !v
                      )
                    }
                    className="ml-auto"
                  >
                    {v1Visible ? (
                      <Eye
                        size={12}
                      />
                    ) : (
                      <EyeOff
                        size={12}
                      />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setTracksLocked(
                        (v) => !v
                      )
                    }
                    className="ml-2"
                  >
                    {tracksLocked ? (
                      <Lock
                        size={11}
                      />
                    ) : (
                      <Unlock
                        size={11}
                      />
                    )}
                  </button>
                </div>

                <div
                  onClick={
                    handleTimelineClick
                  }
                  className="relative flex-1 bg-[#0B0E13]"
                >
                  {renderVideoClips(
                    "V1",
                    v1Height
                  )}
                </div>
              </div>

              <div
                onMouseDown={(
                  event
                ) =>
                  startTrackResize(
                    event,
                    "V1",
                    v1Height
                  )
                }
                className="h-[5px] ml-[88px] cursor-row-resize hover:bg-violet-500/20"
              />

              {/* A1 */}

              <div
                className="flex border-b border-[#171B21]"
                style={{
                  height: `${audioHeight}px`,
                }}
              >
                <div className="w-[88px] shrink-0 bg-[#101319] border-r border-[#222630] flex items-center px-3">
                  <span className="text-[10px]">
                    A1
                  </span>

                  <button
                    onClick={() =>
                      setAudioMuted(
                        (m) => !m
                      )
                    }
                    className="ml-auto"
                  >
                    {audioMuted ? (
                      <VolumeX
                        size={12}
                      />
                    ) : (
                      <Volume2
                        size={12}
                      />
                    )}
                  </button>
                </div>

                <div className="relative flex-1 bg-[#0B0E13]">
                  {timelineClips
                    .filter(
                      (clip) =>
                        clip.track ===
                        "V1"
                    )
                    .map(
                      (clip) => {
                        const left =
                          clip.timelineStart *
                          pixelsPerSecond;

                        const width =
                          clip.duration *
                          pixelsPerSecond;

                        const waveform =
                          getWaveform(
                            clip,
                            width
                          );

                        return (
                          <div
                            key={`audio-${clip.id}`}
                            className={`absolute top-1 bottom-1 rounded bg-violet-500/10 border ${
                              selectedClipId ===
                              clip.id
                                ? "border-violet-200"
                                : "border-violet-500/20"
                            }`}
                            style={{
                              left: `${left}px`,

                              width: `${Math.max(
                                width,
                                4
                              )}px`,
                            }}
                          >
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
                                    className="flex-1 min-w-[1px] max-w-[3px] rounded-full bg-violet-300/75"
                                    style={{
                                      height: `${Math.max(
                                        3,

                                        value *
                                          Math.max(
                                            18,

                                            audioHeight -
                                              18
                                          )
                                      )}px`,
                                    }}
                                  />
                                )
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                </div>
              </div>

              <div
                onMouseDown={(
                  event
                ) =>
                  startTrackResize(
                    event,
                    "A1",
                    audioHeight
                  )
                }
                className="h-[5px] ml-[88px] cursor-row-resize hover:bg-violet-500/20"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}