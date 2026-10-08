"use client";

type Props = {
  projectDuration: number;

  pixelsPerSecond: number;
};

export default function TimelineRuler({
  projectDuration,
  pixelsPerSecond,
}: Props) {
  const rulerEnd = Math.max(
    45,
    Math.ceil(projectDuration + 10)
  );

  const marks: number[] = [];

  for (
    let second = 0;
    second <= rulerEnd;
    second += 5
  ) {
    marks.push(second);
  }

  return (
    <div className="h-7 shrink-0 relative border-b border-[#20252E] bg-[#0D1015]">

      {marks.map((time) => (
        <div
          key={time}
          className="absolute bottom-0"
          style={{
            left: `${
              88 + time * pixelsPerSecond
            }px`,
          }}
        >
          <div className="h-2 w-px bg-white/10" />

          <span className="absolute bottom-2 -translate-x-1/2 text-[9px] text-white/25 whitespace-nowrap">
            {time}s
          </span>
        </div>
      ))}

    </div>
  );
}