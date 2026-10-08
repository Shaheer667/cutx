import { MediaItem } from "@/types/editor";

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

export async function generateVideoThumbnails(
  url: string,
  count = 12
) {
  const video =
    document.createElement(
      "video"
    );

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

  if (!ctx) {
    return [];
  }

  const thumbnails: string[] = [];

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const progress =
      count === 1
        ? 0
        : i / (count - 1);

    const seekTime =
      Math.min(
        duration * progress,
        Math.max(
          0,
          duration - 0.05
        )
      );

    video.currentTime =
      seekTime;

    try {
      await waitForVideoEvent(
        video,
        "seeked"
      );

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
        canvas.toDataURL(
          "image/jpeg",
          0.6
        )
      );
    } catch {
      // Failed frame skip
    }
  }

  video.removeAttribute("src");
  video.load();

  return thumbnails;
}

export async function generateWaveform(
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

    const waveform: number[] = [];

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

export async function processMediaFile(
  file: File
): Promise<MediaItem> {
  const url =
    URL.createObjectURL(file);

  const video =
    document.createElement(
      "video"
    );

  video.src = url;
  video.preload = "metadata";
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