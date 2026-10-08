"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  MediaItem,
  TimelineClip,
  VideoTrack,
} from "@/types/editor";

import {
  BASE_PIXELS_PER_SECOND,
  MAX_HISTORY,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
} from "@/constants/editor";

import {
  cloneClips,
  getClipAtTime,
  getProjectDuration,
  getTrackEnd,
} from "@/engine/timeline";

import {
  processMediaFile,
} from "@/engine/media";

export function useEditor() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

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

  const [
    mediaItems,
    setMediaItems,
  ] = useState<MediaItem[]>([]);

  const [
    timelineClips,
    setTimelineClips,
  ] = useState<TimelineClip[]>(
    []
  );

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

  const projectDuration =
    getProjectDuration(
      timelineClips
    );

  const pixelsPerSecond =
    BASE_PIXELS_PER_SECOND *
    (zoom / 100);

  const pushHistory = () => {
    const snapshot =
      cloneClips(
        timelineClipsRef.current
      );

    setPast((prev) => [
      ...prev.slice(
        -(MAX_HISTORY - 1)
      ),
      snapshot,
    ]);

    setFuture([]);
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
  };

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

      setIsImporting(true);

      try {
        for (const file of videoFiles) {
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
        }
      } finally {
        setIsImporting(false);
      }

      event.target.value = "";
    };

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
      setActiveV1Media(media);
    } else {
      setActiveV2Media(media);
    }
  };

  const togglePlay =
    async () => {
      if (isPlaying) {
        v1VideoRef.current?.pause();
        v2VideoRef.current?.pause();

        setIsPlaying(false);

        return;
      }

      const clip =
        getClipAtTime(
          timelineClipsRef.current,
          currentTime,
          "V1"
        );

      if (!clip) return;

      const media =
        mediaItems.find(
          (item) =>
            item.id ===
            clip.mediaId
        );

      if (!media) return;

      setActiveV1Media(media);

      setIsPlaying(true);
    };

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
    };

  const splitAtPlayhead =
    () => {
      if (tracksLocked) return;

      const clip =
        timelineClipsRef.current.find(
          (clip) =>
            currentTime >
              clip.timelineStart &&
            currentTime <
              clip.timelineStart +
                clip.duration
        );

      if (!clip) return;

      pushHistory();

      const leftDuration =
        currentTime -
        clip.timelineStart;

      const rightDuration =
        clip.duration -
        leftDuration;

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
              item.id === clip.id
                ? [left, right]
                : [item]
          )
      );

      setSelectedClipId(
        right.id
      );
    };

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

    importMedia,

    addMediaToTrack,

    togglePlay,

    splitAtPlayhead,

    deleteSelectedClip,

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