import type { InputProps } from "@/types";
import { Input } from "./ui/input";

export default function DurationInput({ editing, value, onChange }: InputProps<number>) {
    const m = Math.floor(value / 60);
    const s = value % 60;

    if (!editing) {
      return (
        <>
          {m}m {s}s
        </>
      );
    }

    const minuteChange = (newVal: number) => {
      onChange(Math.max(0, newVal * 60 + s));
    };
    const secondChange = (newVal: number) => {
      onChange(Math.max(0, m * 60 + newVal));
    };

    return (
      <>
        <Input
          className="w-20"
          type="number"
          value={m}
          min={0}
          onChange={(e) => minuteChange(Number(e.target.value))}
        />
        m{" "}
        <Input
          className="w-20"
          type="number"
          value={s}
          min={m === 0 ? 0 : undefined}
          onChange={(e) => secondChange(Number(e.target.value))}
        />
        s
      </>
    );
  };