import {
    Pause,
    Play,
} from "lucide-react";

import {
    MediaItem,
} from "@/types/editor";

import {
    formatTime,
} from "@/utils/time";

type Props = {
    v1VideoRef:
    React.RefObject<HTMLVideoElement | null>;

    v2VideoRef:
    React.RefObject<HTMLVideoElement | null>;

    activeV1Media:
    MediaItem | null;

    activeV2Media:
    MediaItem | null;

    v1Visible: boolean;

    v2Visible: boolean;

    audioMuted: boolean;

    isPlaying: boolean;

    currentTime: number;

    projectDuration: number;

    onTogglePlay: () => void;

    onV1TimeUpdate: () => void;

    onV1LoadedMetadata: () => void;

    onV2LoadedMetadata: () => void;
};

export default function PreviewPanel({
    v1VideoRef,
    v2VideoRef,
    activeV1Media,
    activeV2Media,
    v1Visible,
    v2Visible,
    audioMuted,
    isPlaying,
    currentTime,
    projectDuration,
    onTogglePlay,
    onV1TimeUpdate,
    onV1LoadedMetadata,
    onV2LoadedMetadata,
}: Props) {
    return (
        <section className="flex-1 min-w-0 flex flex-col bg-[#090B0F]">

            <div className="flex-1 min-h-0 flex items-center justify-center px-5 py-4 overflow-hidden">

                <div
                    className="
    relative
    aspect-video
    w-[min(92%,1000px)]
    max-h-[95%]
    bg-black
    rounded-xl
    overflow-hidden
    border
    border-[#242933]
    shadow-2xl
    shadow-black/40
  "
                >

                    {activeV1Media && (
                        <video
  ref={v1VideoRef}
  key={activeV1Media.id}
  src={activeV1Media.url}
  muted={audioMuted}
  onLoadedMetadata={
    onV1LoadedMetadata
  }
  onTimeUpdate={
    onV1TimeUpdate
  }
  className={`absolute inset-0 w-full h-full object-contain ${
    v1Visible
      ? "opacity-100"
      : "opacity-0"
  }`}
/>
                    )}

                    {activeV2Media && (
                        <video
  ref={v2VideoRef}
  key={activeV2Media.id}
  src={activeV2Media.url}
  muted
  onLoadedMetadata={
    onV2LoadedMetadata
  }
  className={`absolute inset-0 z-10 w-full h-full object-contain ${
    v2Visible
      ? "opacity-100"
      : "opacity-0"
  }`}
/>
                    )}

                    {!activeV1Media &&
                        !activeV2Media && (
                            <div className="absolute inset-0 flex items-center justify-center text-white/25 text-xs">
                                Import and add media
                            </div>
                        )}

                </div>

            </div>

            <div className="h-12 shrink-0 border-t border-[#1D222B] flex items-center justify-center gap-5">

                <span className="text-xs text-white/40 tabular-nums">
                    {formatTime(
                        currentTime
                    )}
                </span>

                <button
                    onClick={onTogglePlay}
                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"
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
    );
}