"use client";

export function ConfidenceSlider(props: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const pct = Math.round(props.value * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <div>Confidence threshold</div>
        <div className="tabular-nums">{pct}%</div>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

