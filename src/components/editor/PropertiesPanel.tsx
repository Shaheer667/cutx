import {
  Maximize2,
  Move,
  RotateCw,
  SlidersHorizontal,
} from "lucide-react";

export default function PropertiesPanel() {
  return (
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

          <Move size={14} />

          Transform

        </div>

        <div className="grid grid-cols-2 gap-2">

          <input
            placeholder="X"
            className="bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs outline-none focus:border-violet-500"
          />

          <input
            placeholder="Y"
            className="bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs outline-none focus:border-violet-500"
          />

        </div>

        <div>

          <div className="text-[10px] text-white/40 mb-2 flex gap-2">

            <Maximize2 size={12} />

            Scale

          </div>

          <input
            defaultValue="100%"
            className="w-full bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs"
          />

        </div>

        <div>

          <div className="text-[10px] text-white/40 mb-2 flex gap-2">

            <RotateCw size={12} />

            Rotation

          </div>

          <input
            defaultValue="0°"
            className="w-full bg-[#0B0E13] border border-[#282D36] rounded-lg p-2 text-xs"
          />

        </div>

        <div className="border-t border-[#222630] pt-5">

          <div className="flex gap-2 text-xs mb-3">

            <SlidersHorizontal size={14} />

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
  );
}