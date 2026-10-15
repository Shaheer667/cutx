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

export type ClipTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
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

  /*
    Visual stacking order.

    V1 normally stays at 0.
    Overlays/text use 10+.
  */
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