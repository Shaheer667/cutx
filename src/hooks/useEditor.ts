"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  DragState,
  MediaItem,
  TimelineClip,
  TrackResizeState,
  TrimState,
  VideoTrack,
} from "@/types/editor";

import {
  BASE_PIXELS_PER_SECOND,
  DEFAULT_AUDIO_HEIGHT,
  DEFAULT_V1_HEIGHT,
  DEFAULT_V2_HEIGHT,
  MAX_HISTORY,
  MAX_TRACK_HEIGHT,
  MAX_ZOOM,
  MIN_CLIP_DURATION,
  MIN_TRACK_HEIGHT,
  MIN_ZOOM,
  ZOOM_STEP,
} from "@/constants/editor";

import {
  cloneClips,
  getClipAtTime,
  getProjectDuration,
  getSnappedStart,
  getTrackEnd,
} from "@/engine/timeline";

import {
  processMediaFile,
} from "@/engine/media";

export function useEditor() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const v1VideoRef =
    useRef<HTMLVideoElement | null>(null);

  const v2VideoRef =
    useRef<HTMLVideoElement | null>(null);

  const timelineClipsRef =
    useRef<TimelineClip[]>([]);

  const activeV1ClipIdRef =
    useRef<string | null>(null);

  const activeV2ClipIdRef =
    useRef<string | null>(null);

  const shouldAutoPlayRef =
    useRef(false);

  const dragStateRef =
    useRef<DragState | null>(null);

  const trimStateRef =
    useRef<TrimState | null>(null);

  const resizeStateRef =
    useRef<TrackResizeState | null>(null);

  const operationSnapshotRef =
    useRef<TimelineClip[] | null>(null);

  const [mediaItems, setMediaItems] =
    useState<MediaItem[]>([]);

  const [timelineClips, setTimelineClips] =
    useState<TimelineClip[]>([]);

  const [selectedClipId, setSelectedClipId] =
    useState<string | null>(null);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [isImporting, setIsImporting] =
    useState(false);

  const [zoom, setZoom] =
    useState(100);

  const [past, setPast] =
    useState<TimelineClip[][]>([]);

  const [future, setFuture] =
    useState<TimelineClip[][]>([]);

  const [activeV1Media, setActiveV1Media] =
    useState<MediaItem | null>(null);

  const [activeV2Media, setActiveV2Media] =
    useState<MediaItem | null>(null);

  const [v1Visible, setV1Visible] =
    useState(true);

  const [v2Visible, setV2Visible] =
    useState(true);

  const [audioMuted, setAudioMuted] =
    useState(false);

  const [tracksLocked, setTracksLocked] =
    useState(false);

  const [v1Height, setV1Height] =
    useState(DEFAULT_V1_HEIGHT);

  const [v2Height, setV2Height] =
    useState(DEFAULT_V2_HEIGHT);

  const [audioHeight, setAudioHeight] =
    useState(DEFAULT_AUDIO_HEIGHT);

  useEffect(() => {
    timelineClipsRef.current =
      timelineClips;
  }, [timelineClips]);

  useEffect(() => {
    if (v1VideoRef.current) {
      v1VideoRef.current.muted =
        audioMuted;
    }
  }, [audioMuted, activeV1Media]);

  const projectDuration =
    getProjectDuration(
      timelineClips
    );

  const pixelsPerSecond =
    BASE_PIXELS_PER_SECOND *
    (zoom / 100);

  const getMediaById = (
    mediaId: string
  ) =>
    mediaItems.find(
      (item) =>
        item.id === mediaId
    );

  const getNextClipOnTrack = (
    track: VideoTrack,
    time: number,
    excludedId?: string
  ) =>
    [...timelineClipsRef.current]
      .filter(
        (clip) =>
          clip.track === track &&
          clip.id !== excludedId &&
          clip.timelineStart >=
            time - 0.02
      )
      .sort(
        (a, b) =>
          a.timelineStart -
          b.timelineStart
      )[0];

  /* ---------------------------------------
     HISTORY
  --------------------------------------- */

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

  const pauseAll = () => {
    v1VideoRef.current?.pause();
    v2VideoRef.current?.pause();

    shouldAutoPlayRef.current =
      false;

    setIsPlaying(false);
  };

  const undo = () => {
    if (!past.length) return;

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
    if (!future.length) return;

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

  /* ---------------------------------------
     IMPORT
  --------------------------------------- */

  const importMedia =
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
          } catch (error) {
            console.error(
              "Import failed:",
              error
            );
          }
        }
      } finally {
        setIsImporting(false);
      }

      event.target.value = "";
    };

  /* ---------------------------------------
     ADD MEDIA
  --------------------------------------- */

  const addMediaToTrack = (
    media: MediaItem,
    track: VideoTrack
  ) => {
    pushHistory();

    const timelineStart =
      track === "V1"
        ? getTrackEnd(
            timelineClipsRef.current,
            "V1"
          )
        : currentTime;

    const clip: TimelineClip = {
      id: crypto.randomUUID(),
      mediaId: media.id,
      name: media.name,
      sourceUrl: media.url,
      track,
      timelineStart,
      sourceStart: 0,
      duration: media.duration,
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

    if (track === "V1") {
      activeV1ClipIdRef.current =
        clip.id;

      setActiveV1Media(
        media
      );
    } else {
      activeV2ClipIdRef.current =
        clip.id;

      setActiveV2Media(
        media
      );
    }
  };

  /* ---------------------------------------
     PREVIEW / SEEK HELPERS
  --------------------------------------- */

  const syncV2ToTime = async (
    timelineTime: number,
    autoplay: boolean
  ) => {
    const clip =
      getClipAtTime(
        timelineClipsRef.current,
        timelineTime,
        "V2"
      );

    if (!clip || !v2Visible) {
      activeV2ClipIdRef.current =
        null;

      v2VideoRef.current?.pause();

      if (!clip) {
        setActiveV2Media(null);
      }

      return;
    }

    const media =
      getMediaById(
        clip.mediaId
      );

    if (!media) return;

    activeV2ClipIdRef.current =
      clip.id;

    const targetSourceTime =
      clip.sourceStart +
      Math.max(
        0,
        timelineTime -
          clip.timelineStart
      );

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

    if (!video) return;

    video.muted = true;

    if (
      Math.abs(
        video.currentTime -
          targetSourceTime
      ) > 0.12
    ) {
      video.currentTime =
        targetSourceTime;
    }

    if (
      autoplay &&
      video.paused
    ) {
      try {
        await video.play();
      } catch {}
    }
  };

  const seekTimeline = async (
    timelineTime: number,
    autoplay = false
  ) => {
    const safeTime =
      Math.max(
        0,
        Math.min(
          timelineTime,
          projectDuration
        )
      );

    setCurrentTime(
      safeTime
    );

    shouldAutoPlayRef.current =
      autoplay;

    const v1Clip =
      getClipAtTime(
        timelineClipsRef.current,
        safeTime,
        "V1"
      );

    if (v1Clip) {
      const media =
        getMediaById(
          v1Clip.mediaId
        );

      if (media) {
        activeV1ClipIdRef.current =
          v1Clip.id;

        const targetSourceTime =
          v1Clip.sourceStart +
          Math.max(
            0,
            safeTime -
              v1Clip.timelineStart
          );

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
              targetSourceTime;

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
      activeV1ClipIdRef.current =
        null;

      v1VideoRef.current?.pause();
      setActiveV1Media(null);
    }

    await syncV2ToTime(
      safeTime,
      autoplay
    );
  };

  /* ---------------------------------------
     SELECT
  --------------------------------------- */

  const selectClip = (
    clip: TimelineClip
  ) => {
    pauseAll();

    setSelectedClipId(
      clip.id
    );

    seekTimeline(
      clip.timelineStart,
      false
    );
  };

  /* ---------------------------------------
     TIMELINE CLICK
  --------------------------------------- */

  const seekTimelineFromMouse = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
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

  /* ---------------------------------------
     PLAY / PAUSE
  --------------------------------------- */

  const togglePlay =
    async () => {
      if (!timelineClipsRef.current.length) {
        return;
      }

      if (isPlaying) {
        pauseAll();
        return;
      }

      let startTime =
        currentTime;

      if (
        startTime >=
        projectDuration
      ) {
        startTime = 0;
      }

      let clip =
        getClipAtTime(
          timelineClipsRef.current,
          startTime,
          "V1"
        );

      if (!clip) {
        clip =
          getNextClipOnTrack(
            "V1",
            startTime
          );
      }

      if (!clip) return;

      if (
        startTime <
          clip.timelineStart ||
        startTime >=
          clip.timelineStart +
            clip.duration
      ) {
        startTime =
          clip.timelineStart;
      }

      setIsPlaying(true);

      shouldAutoPlayRef.current =
        true;

      await seekTimeline(
        startTime,
        true
      );
    };

  /* ---------------------------------------
     V1 PLAYHEAD SYNC
  --------------------------------------- */

  const handleV1TimeUpdate = () => {
    const video =
      v1VideoRef.current;

    if (!video) return;

    let clip =
      timelineClipsRef.current.find(
        (item) =>
          item.id ===
          activeV1ClipIdRef.current
      );

    if (!clip) {
      clip =
        getClipAtTime(
          timelineClipsRef.current,
          currentTime,
          "V1"
        );
    }

    if (!clip) return;

    const offset =
      video.currentTime -
      clip.sourceStart;

    const timelineTime =
      clip.timelineStart +
      Math.max(
        0,
        offset
      );

    const clipEnd =
      clip.timelineStart +
      clip.duration;

    if (
      timelineTime <
      clipEnd - 0.04
    ) {
      setCurrentTime(
        Math.min(
          clipEnd,
          timelineTime
        )
      );

      void syncV2ToTime(
        timelineTime,
        isPlaying
      );

      return;
    }

    const nextClip =
      getNextClipOnTrack(
        "V1",
        clipEnd,
        clip.id
      );

    if (!nextClip) {
      pauseAll();

      setCurrentTime(
        clipEnd
      );

      return;
    }

    const nextMedia =
      getMediaById(
        nextClip.mediaId
      );

    if (!nextMedia) {
      pauseAll();
      return;
    }

    setCurrentTime(
      nextClip.timelineStart
    );

    activeV1ClipIdRef.current =
      nextClip.id;

    shouldAutoPlayRef.current =
      true;

    if (
      activeV1Media?.id !==
      nextMedia.id
    ) {
      setActiveV1Media(
        nextMedia
      );
    } else {
      const nextSourceTime =
        nextClip.sourceStart;

      video.currentTime =
        nextSourceTime;

      if (video.paused) {
        void video.play();
      }
    }

    void syncV2ToTime(
      nextClip.timelineStart,
      true
    );
  };

  const handleV1LoadedMetadata =
    async () => {
      const video =
        v1VideoRef.current;

      if (!video) return;

      let clip =
        timelineClipsRef.current.find(
          (item) =>
            item.id ===
            activeV1ClipIdRef.current
        );

      if (!clip) {
        clip =
          getClipAtTime(
            timelineClipsRef.current,
            currentTime,
            "V1"
          );
      }

      if (!clip) return;

      const sourceTime =
        clip.sourceStart +
        Math.max(
          0,
          currentTime -
            clip.timelineStart
        );

      video.currentTime =
        sourceTime;

      video.muted =
        audioMuted;

      if (
        shouldAutoPlayRef.current ||
        isPlaying
      ) {
        try {
          await video.play();
        } catch {}
      }
    };

  const handleV2LoadedMetadata =
    async () => {
      const video =
        v2VideoRef.current;

      if (!video) return;

      let clip =
        timelineClipsRef.current.find(
          (item) =>
            item.id ===
            activeV2ClipIdRef.current
        );

      if (!clip) {
        clip =
          getClipAtTime(
            timelineClipsRef.current,
            currentTime,
            "V2"
          );
      }

      if (!clip) return;

      video.muted = true;

      video.currentTime =
        clip.sourceStart +
        Math.max(
          0,
          currentTime -
            clip.timelineStart
        );

      if (
        (shouldAutoPlayRef.current ||
          isPlaying) &&
        v2Visible
      ) {
        try {
          await video.play();
        } catch {}
      }
    };

  /* ---------------------------------------
     SPLIT
  --------------------------------------- */

  const splitAtPlayhead =
    () => {
      if (tracksLocked) {
        return;
      }

      let clip =
        selectedClipId
          ? timelineClipsRef.current.find(
              (item) =>
                item.id ===
                selectedClipId
            )
          : undefined;

      if (
        !clip ||
        currentTime <=
          clip.timelineStart ||
        currentTime >=
          clip.timelineStart +
            clip.duration
      ) {
        clip =
          getClipAtTime(
            timelineClipsRef.current,
            currentTime,
            "V2"
          ) ??
          getClipAtTime(
            timelineClipsRef.current,
            currentTime,
            "V1"
          );
      }

      if (!clip) return;

      const leftDuration =
        currentTime -
        clip.timelineStart;

      const rightDuration =
        clip.duration -
        leftDuration;

      if (
        leftDuration <=
          MIN_CLIP_DURATION ||
        rightDuration <=
          MIN_CLIP_DURATION
      ) {
        return;
      }

      pushHistory();

      const left: TimelineClip = {
        ...clip,
        id: crypto.randomUUID(),
        duration:
          leftDuration,
      };

      const right: TimelineClip = {
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

      setTimelineClips(
        (prev) =>
          prev.flatMap(
            (item) =>
              item.id === clip!.id
                ? [left, right]
                : [item]
          )
      );

      setSelectedClipId(
        right.id
      );

      if (clip.track === "V1") {
        activeV1ClipIdRef.current =
          right.id;
      } else {
        activeV2ClipIdRef.current =
          right.id;
      }
    };

  /* ---------------------------------------
     DELETE
  --------------------------------------- */

  const deleteSelectedClip =
    () => {
      if (
        !selectedClipId ||
        tracksLocked
      ) {
        return;
      }

      pushHistory();

      setTimelineClips(
        (prev) =>
          prev.filter(
            (clip) =>
              clip.id !==
              selectedClipId
          )
      );

      setSelectedClipId(null);

      pauseAll();
    };

  const rippleDeleteSelectedClip =
    () => {
      if (
        !selectedClipId ||
        tracksLocked
      ) {
        return;
      }

      const deleted =
        timelineClipsRef.current.find(
          (clip) =>
            clip.id ===
            selectedClipId
        );

      if (!deleted) return;

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

      setSelectedClipId(null);

      pauseAll();
    };

  /* ---------------------------------------
     DRAG START
  --------------------------------------- */

  const startClipDrag = (
    event: React.MouseEvent,
    clip: TimelineClip
  ) => {
    if (tracksLocked) return;

    event.stopPropagation();

    pauseAll();

    setSelectedClipId(
      clip.id
    );

    operationSnapshotRef.current =
      cloneClips(
        timelineClipsRef.current
      );

    dragStateRef.current = {
      clipId: clip.id,
      startMouseX:
        event.clientX,
      initialTimelineStart:
        clip.timelineStart,
    };
  };

  /* ---------------------------------------
     TRIM START
  --------------------------------------- */

  const startTrim = (
    event: React.MouseEvent,
    clip: TimelineClip,
    side: "left" | "right"
  ) => {
    if (tracksLocked) return;

    event.stopPropagation();
    event.preventDefault();

    pauseAll();

    setSelectedClipId(
      clip.id
    );

    operationSnapshotRef.current =
      cloneClips(
        timelineClipsRef.current
      );

    trimStateRef.current = {
      clipId:
        clip.id,
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

  /* ---------------------------------------
     TRACK RESIZE
  --------------------------------------- */

  const startTrackResize = (
    event: React.MouseEvent,
    track:
      | "V1"
      | "V2"
      | "A1"
  ) => {
    event.preventDefault();

    const height =
      track === "V1"
        ? v1Height
        : track === "V2"
        ? v2Height
        : audioHeight;

    resizeStateRef.current = {
      track,
      startMouseY:
        event.clientY,
      initialHeight:
        height,
    };
  };

  /* ---------------------------------------
     GLOBAL MOUSE
  --------------------------------------- */

  useEffect(() => {
    const mouseMove = (
      event: MouseEvent
    ) => {
      const resize =
        resizeStateRef.current;

      if (resize) {
        const delta =
          event.clientY -
          resize.startMouseY;

        const height =
          Math.max(
            MIN_TRACK_HEIGHT,
            Math.min(
              MAX_TRACK_HEIGHT,
              resize.initialHeight +
                delta
            )
          );

        if (
          resize.track === "V1"
        ) {
          setV1Height(
            height
          );
        }

        if (
          resize.track === "V2"
        ) {
          setV2Height(
            height
          );
        }

        if (
          resize.track === "A1"
        ) {
          setAudioHeight(
            height
          );
        }

        return;
      }

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
            timelineClipsRef.current,
            clip.id,
            proposed,
            clip.duration,
            pixelsPerSecond
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

      const trim =
        trimStateRef.current;

      if (!trim) return;

      const clip =
        timelineClipsRef.current.find(
          (item) =>
            item.id ===
            trim.clipId
        );

      if (!clip) return;

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

        const actualDelta =
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
                            actualDelta
                        ),
                      duration:
                        Math.max(
                          MIN_CLIP_DURATION,
                          trim.initialDuration -
                            actualDelta
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
          pushHistory(
            old
          );
        }
      }

      operationSnapshotRef.current =
        null;

      dragStateRef.current =
        null;

      trimStateRef.current =
        null;

      resizeStateRef.current =
        null;
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

  /* ---------------------------------------
     FRAMES
  --------------------------------------- */

  const getFrames = (
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

    const frameCount =
      Math.max(
        1,
        Math.min(
          20,
          Math.ceil(
            width / 65
          )
        )
      );

    return Array.from(
      {
        length:
          frameCount,
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
          Math.max(
            0,
            Math.min(
              1,
              sourceTime /
                media.duration
            )
          );

        const indexInMedia =
          Math.round(
            normalized *
              (media.thumbnails
                .length -
                1)
          );

        return media.thumbnails[
          indexInMedia
        ];
      }
    );
  };

  /* ---------------------------------------
     WAVEFORM
  --------------------------------------- */

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
        length:
          count,
      },

      (_, index) => {
        const progress =
          count === 1
            ? 0
            : index /
              (count - 1);

        const sourceTime =
          clip.sourceStart +
          clip.duration *
            progress;

        const normalized =
          Math.max(
            0,
            Math.min(
              1,
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

  /* ---------------------------------------
     ZOOM
  --------------------------------------- */

  const zoomIn = () =>
    setZoom((prev) =>
      Math.min(
        MAX_ZOOM,
        prev + ZOOM_STEP
      )
    );

  const zoomOut = () =>
    setZoom((prev) =>
      Math.max(
        MIN_ZOOM,
        prev - ZOOM_STEP
      )
    );

  /* ---------------------------------------
     KEYBOARD
  --------------------------------------- */

  useEffect(() => {
    const keyboard = (
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
        splitAtPlayhead();
        return;
      }

      if (
        event.code === "Space"
      ) {
        event.preventDefault();
        void togglePlay();
        return;
      }

      if (
        event.key === "Delete" ||
        event.key === "Backspace"
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
    isPlaying,
    tracksLocked,
    projectDuration,
    activeV1Media,
    activeV2Media,
    audioMuted,
  ]);

  return {
    fileInputRef,

    v1VideoRef,
    v2VideoRef,

    mediaItems,
    timelineClips,

    selectedClipId,
    setSelectedClipId,

    currentTime,
    setCurrentTime,

    isPlaying,
    isImporting,

    zoom,
    pixelsPerSecond,

    projectDuration,

    activeV1Media,
    activeV2Media,

    v1Visible,
    setV1Visible,

    v2Visible,
    setV2Visible,

    audioMuted,
    setAudioMuted,

    tracksLocked,
    setTracksLocked,

    v1Height,
    v2Height,
    audioHeight,

    importMedia,

    addMediaToTrack,

    selectClip,

    seekTimelineFromMouse,

    togglePlay,

    handleV1TimeUpdate,
    handleV1LoadedMetadata,
    handleV2LoadedMetadata,

    splitAtPlayhead,

    deleteSelectedClip,

    rippleDeleteSelectedClip,

    startClipDrag,

    startTrim,

    startTrackResize,

    getFrames,

    getWaveform,

    undo,
    redo,

    canUndo:
      past.length > 0,

    canRedo:
      future.length > 0,

    zoomIn,
    zoomOut,
  };
}
