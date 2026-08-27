"use client";

import { Armchair, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripSeat } from "../types";

interface BusSeatMapProps {
  seats: TripSeat[];
  rows: number;
  columnsPerRow: number;
  aisleAfterColumn: number;
  selectedSeatIds: string[];
  pendingSeatId?: string;
  disabled?: boolean;
  onSeatClick: (seat: TripSeat) => void;
}

export function BusSeatMap({
  seats,
  rows,
  columnsPerRow,
  aisleAfterColumn,
  selectedSeatIds,
  pendingSeatId,
  disabled,
  onSeatClick,
}: BusSeatMapProps) {
  const seatAt = new Map(seats.map((seat) => [`${seat.row}-${seat.column}`, seat]));
  const gridColumns = columnsPerRow + (aisleAfterColumn > 0 ? 1 : 0);

  return (
    <div className="mx-auto w-full max-w-lg rounded-[2rem] border border-border bg-gradient-to-b from-muted/55 to-card p-5 shadow-inner shadow-slate-900/[0.035] sm:p-7">
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
        <div><span className="text-xs font-semibold text-foreground">مقدمة الحافلة</span><p className="mt-0.5 text-[10px] text-muted-foreground">اختر مقعدًا من المقاعد المتاحة</p></div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted text-muted-foreground" aria-label="مقعد السائق">
          <Circle className="h-4 w-4" />
        </div>
      </div>

      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows }).flatMap((_, rowIndex) => {
          const row = rowIndex + 1;
          const cells = [];
          for (let column = 1; column <= columnsPerRow; column += 1) {
            const seat = seatAt.get(`${row}-${column}`);
            if (seat) {
              const selected = selectedSeatIds.includes(seat.id);
              const available = seat.status === "AVAILABLE" || selected;
              const pending = pendingSeatId === seat.id;
              cells.push(
                <button
                  key={seat.id}
                  type="button"
                  aria-label={`المقعد ${seat.label}، ${selected ? "محدد" : available ? "متاح" : "غير متاح"}`}
                  aria-pressed={selected}
                  disabled={disabled || pending || !available || seat.seatType === "BLOCKED" || seat.seatType === "DRIVER"}
                  onClick={() => onSeatClick(seat)}
                  className={cn(
                    "flex h-12 min-w-0 flex-col items-center justify-center rounded-xl border text-[11px] font-bold transition-all duration-200",
                    selected && "-translate-y-0.5 border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-3 ring-blue-500/15",
                    !selected && available && "border-emerald-500/55 bg-emerald-50/70 text-emerald-800 shadow-sm hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-300",
                    !selected && !available && "cursor-not-allowed border-border bg-muted/80 text-muted-foreground opacity-65",
                  )}
                >
                  {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Armchair className="h-5 w-5" />}
                  <span>{seat.label}</span>
                </button>,
              );
            } else {
              cells.push(<div key={`empty-${row}-${column}`} />);
            }
            if (column === aisleAfterColumn) {
              cells.push(<div key={`aisle-${row}`} aria-hidden="true" className="flex items-center justify-center text-[10px] text-muted-foreground">{row}</div>);
            }
          }
          return cells;
        })}
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-4 border-t border-border/70 pt-4 text-[11px] text-muted-foreground">
        <Legend className="border-emerald-500 bg-background" label="متاح" />
        <Legend className="border-blue-600 bg-blue-600" label="محدد" />
        <Legend className="border-muted bg-muted" label="محجوز" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return <span className="flex items-center gap-2"><span className={cn("h-4 w-4 rounded border-2", className)} />{label}</span>;
}
