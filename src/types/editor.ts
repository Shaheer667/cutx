export type VideoTrack = "V1" | "V2";

export type MediaItem = {
  id: string;
  name: string;
  url: string;
  file: File;
  duration: number;
  thumbnails: string[];
  waveform: number[];
};

export type TimelineClip = {
  id: string;

  mediaId: string;
  name: string;
  sourceUrl: string;

  track: VideoTrack;

  timelineStart: number;
  sourceStart: number;
  duration: number;
};

export type DragState = {
  clipId: string;
  startMouseX: number;
  initialTimelineStart: number;
};

export type TrimState = {
  clipId: string;
  side: "left" | "right";

  startMouseX: number;

  initialTimelineStart: number;
  initialSourceStart: number;
  initialDuration: number;
};

export type TrackResizeState = {
  track: "V1" | "V2" | "A1";

  startMouseY: number;
  initialHeight: number;
};