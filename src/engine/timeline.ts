import {
  TimelineClip,
  VideoTrack,
} from "@/types/editor";

export function cloneClips(
  clips: TimelineClip[]
) {
  return clips.map((clip) => ({
    ...clip,
  }));
}

export function getClipAtTime(
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
      const clipEnd =
        clip.timelineStart +
        clip.duration;

      return (
        timelineTime >=
          clip.timelineStart &&
        timelineTime < clipEnd
      );
    });
}

export function getProjectDuration(
  clips: TimelineClip[]
) {
  if (!clips.length) {
    return 0;
  }

  return Math.max(
    ...clips.map(
      (clip) =>
        clip.timelineStart +
        clip.duration
    )
  );
}

export function getTrackEnd(
  clips: TimelineClip[],
  track: VideoTrack
) {
  const trackClips =
    clips.filter(
      (clip) =>
        clip.track === track
    );

  if (!trackClips.length) {
    return 0;
  }

  return Math.max(
    ...trackClips.map(
      (clip) =>
        clip.timelineStart +
        clip.duration
    )
  );
}

export function getSnappedStart(
  clips: TimelineClip[],
  clipId: string,
  proposedStart: number,
  duration: number,
  pixelsPerSecond: number
) {
  const threshold =
    10 / pixelsPerSecond;

  const snapPoints: number[] = [0];

  clips.forEach((clip) => {
    if (clip.id === clipId) {
      return;
    }

    snapPoints.push(
      clip.timelineStart
    );

    snapPoints.push(
      clip.timelineStart +
        clip.duration
    );
  });

  let bestStart =
    proposedStart;

  let bestDistance =
    threshold;

  const proposedEnd =
    proposedStart +
    duration;

  snapPoints.forEach((point) => {
    const startDistance =
      Math.abs(
        proposedStart - point
      );

    if (
      startDistance <
      bestDistance
    ) {
      bestDistance =
        startDistance;

      bestStart = point;
    }

    const endDistance =
      Math.abs(
        proposedEnd - point
      );

    if (
      endDistance <
      bestDistance
    ) {
      bestDistance =
        endDistance;

      bestStart =
        point - duration;
    }
  });

  return Math.max(
    0,
    bestStart
  );
}