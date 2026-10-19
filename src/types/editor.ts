export type VideoTrack = "V1" | "V2";

export type TimelineTrack =
  | VideoTrack
  | "T1";

export type MediaItem = {
  id: string;
  name: string;
  url: string;
  file: File;
  duration: number;
  thumbnails: string[];
  waveform: number[];
};

export type VideoFitMode =
  | "fit"
  | "fill";

export type ClipTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;

  fitMode?: VideoFitMode;

  flipX?: boolean;
  flipY?: boolean;

  cropTop?: number;
  cropRight?: number;
  cropBottom?: number;
  cropLeft?: number;
};

export type ClipAudioSettings = {
  /*
    0 = silent
    100 = original volume
    200 = boosted prototype level
  */
  volume: number;

  muted: boolean;

  /*
    Seconds from clip start/end.
  */
  fadeIn: number;

  fadeOut: number;
};

export type TextAlign =
  | "left"
  | "center"
  | "right";

export type TextStyle = {
  fontSize: number;
  color: string;
  align: TextAlign;
  fontWeight: number;
};

type BaseTimelineClip = {
  id: string;

  name: string;

  timelineStart: number;

  duration: number;

  zIndex: number;

  transform: ClipTransform;
};

export type VideoTimelineClip =
  BaseTimelineClip & {
    kind: "video";

    mediaId: string;

    sourceUrl: string;

    track: VideoTrack;

    sourceStart: number;

    audio: ClipAudioSettings;
  };

export type TextTimelineClip =
  BaseTimelineClip & {
    kind: "text";

    track: "T1";

    text: string;

    textStyle: TextStyle;
  };

export type TimelineClip =
  | VideoTimelineClip
  | TextTimelineClip;

export type DragState = {
  clipId: string;

  startMouseX: number;

  initialTimelineStart: number;
};

export type TrimState = {
  clipId: string;

  side:
    | "left"
    | "right";

  startMouseX: number;

  initialTimelineStart: number;

  initialSourceStart: number;

  initialDuration: number;
};

export type TrackResizeState = {
  track:
    | "V1"
    | "V2"
    | "A1";

  startMouseY: number;

  initialHeight: number;
};