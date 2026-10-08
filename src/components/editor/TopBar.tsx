import {
  Check,
  Undo2,
  Redo2,
} from "lucide-react";

type Props = {
  canUndo: boolean;
  canRedo: boolean;

  onUndo: () => void;
  onRedo: () => void;
};

export default function TopBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: Props) {
  return (
    <header className="h-14 shrink-0 border-b border-[#222630] bg-[#0D1015] flex items-center justify-between px-4">

      <div className="flex items-center gap-3">

        <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center font-bold">
          C
        </div>

        <span className="font-semibold">
          CUTX
        </span>

      </div>

      <div className="flex items-center gap-3">

        <input
          defaultValue="Untitled Project"
          className="bg-transparent text-sm text-center outline-none border-b border-transparent focus:border-violet-400"
        />

        <div className="flex items-center gap-1 text-[11px] text-emerald-400">

          <Check size={13} />

          Saved

        </div>

      </div>

      <div className="flex items-center gap-2">

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-20"
          title="Undo"
        >
          <Undo2 size={17} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-20"
          title="Redo"
        >
          <Redo2 size={17} />
        </button>

        <button className="bg-violet-500 hover:bg-violet-400 px-5 py-2 rounded-lg text-sm font-semibold">
          Export
        </button>

      </div>

    </header>
  );
}