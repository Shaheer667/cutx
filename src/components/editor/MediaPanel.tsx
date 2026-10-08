import {
  MonitorPlay,
  Plus,
  Upload,
} from "lucide-react";

import {
  MediaItem,
  VideoTrack,
} from "@/types/editor";

import {
  formatTime,
} from "@/utils/time";

type Props = {
  mediaItems: MediaItem[];

  isImporting: boolean;

  onImport: () => void;

  onAddToTrack: (
    media: MediaItem,
    track: VideoTrack
  ) => void;
};

export default function MediaPanel({
  mediaItems,
  isImporting,
  onImport,
  onAddToTrack,
}: Props) {
  return (
    <section className="w-[300px] shrink-0 border-r border-[#222630] bg-[#101319] p-4 overflow-y-auto">

      <div className="flex justify-between mb-4">

        <h2 className="text-sm font-semibold">
          Media
        </h2>

        <span className="text-[10px] text-white/30">
          {mediaItems.length} files
        </span>

      </div>

      <button
        onClick={onImport}
        disabled={isImporting}
        className="w-full h-24 rounded-xl border border-dashed border-[#323846] bg-[#12161D] hover:border-violet-500/50 flex flex-col items-center justify-center gap-2 disabled:opacity-50"
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

                {media.thumbnails[0] ? (
                  <img
                    src={
                      media.thumbnails[0]
                    }
                    alt=""
                    draggable={false}
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
                    media.duration
                  )}
                </span>

              </div>

              <div className="p-2">

                <p className="text-[10px] truncate">
                  {media.name}
                </p>

                <div className="grid grid-cols-2 gap-1 mt-2">

                  <button
                    onClick={() =>
                      onAddToTrack(
                        media,
                        "V1"
                      )
                    }
                    className="h-6 rounded bg-violet-500/15 hover:bg-violet-500/30 text-[9px] text-violet-200 flex items-center justify-center gap-1"
                  >
                    <Plus size={10} />
                    V1
                  </button>

                  <button
                    onClick={() =>
                      onAddToTrack(
                        media,
                        "V2"
                      )
                    }
                    className="h-6 rounded bg-blue-500/15 hover:bg-blue-500/30 text-[9px] text-blue-200 flex items-center justify-center gap-1"
                  >
                    <Plus size={10} />
                    V2
                  </button>

                </div>

              </div>

            </div>
          )
        )}

      </div>

    </section>
  );
}