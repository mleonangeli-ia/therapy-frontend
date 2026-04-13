"use client";
interface Props {
  value?: number;
  onChange: (v: number) => void;
  label?: string;
}

const MOOD_LABELS: Record<number, { emoji: string; label: string; color: string }> = {
  1:  { emoji: "😞", label: "Muy mal",    color: "bg-red-100 border-red-300 text-red-700" },
  2:  { emoji: "😟", label: "Mal",        color: "bg-red-50 border-red-200 text-red-600" },
  3:  { emoji: "😔", label: "Regular-",   color: "bg-orange-100 border-orange-300 text-orange-700" },
  4:  { emoji: "😕", label: "Regular",    color: "bg-orange-50 border-orange-200 text-orange-600" },
  5:  { emoji: "😐", label: "Neutro",     color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  6:  { emoji: "🙂", label: "Bastante bien", color: "bg-lime-50 border-lime-200 text-lime-700" },
  7:  { emoji: "😊", label: "Bien",       color: "bg-green-50 border-green-200 text-green-600" },
  8:  { emoji: "😄", label: "Muy bien",   color: "bg-green-100 border-green-300 text-green-700" },
  9:  { emoji: "😁", label: "Excelente",  color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  10: { emoji: "🌟", label: "Increíble",  color: "bg-emerald-100 border-emerald-300 text-emerald-700" },
};

export function MoodSelector({ value, onChange, label = "¿Cómo te sentís?" }: Props) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const info = MOOD_LABELS[n];
          const selected = value === n;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              title={info.label}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 text-xs font-medium
                transition-all hover:scale-105
                ${selected ? info.color + " scale-105 shadow-sm" : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"}
              `}
            >
              <span className="text-lg">{info.emoji}</span>
              <span>{n}</span>
            </button>
          );
        })}
      </div>
      {value && (
        <p className="text-xs text-gray-500 mt-2">
          Seleccionaste: {MOOD_LABELS[value].emoji} {MOOD_LABELS[value].label}
        </p>
      )}
    </div>
  );
}
