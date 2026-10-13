"use client";

import {
  Upload,
  Type,
  Music2,
  Captions,
  Sparkles,
} from "lucide-react";

type Props = {
  onAddText: () => void;
};

const tools = [
  {
    label: "Media",
    icon: Upload,
  },

  {
    label: "Text",
    icon: Type,
  },

  {
    label: "Audio",
    icon: Music2,
  },

  {
    label: "Captions",
    icon: Captions,
  },

  {
    label: "Effects",
    icon: Sparkles,
  },
];

export default function ToolSidebar({
  onAddText,
}: Props) {
  return (
    <aside className="w-[74px] shrink-0 border-r border-[#222630] bg-[#0D1015] py-3 flex flex-col items-center gap-1">
      {tools.map(
        (
          item,
          index
        ) => {
          const Icon =
            item.icon;

          const isMedia =
            index === 0;

          return (
            <button
              key={
                item.label
              }
              onClick={() => {
                if (
                  item.label ===
                  "Text"
                ) {
                  onAddText();
                }
              }}
              title={
                item.label ===
                "Text"
                  ? "Add text at playhead"
                  : item.label
              }
              className={`w-[58px] py-2.5 rounded-xl flex flex-col items-center gap-1 transition ${
                isMedia
                  ? "bg-violet-500/15 text-violet-300"
                  : "text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon
                size={18}
              />

              <span className="text-[10px]">
                {
                  item.label
                }
              </span>
            </button>
          );
        }
      )}
    </aside>
  );
}