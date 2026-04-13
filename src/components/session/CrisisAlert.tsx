import { PhoneCall } from "lucide-react";

interface Props {
  message: string;
  resources: string[];
}

export function CrisisAlert({ message, resources }: Props) {
  return (
    <div className="mx-4 mb-4 bg-red-50 border-2 border-red-200 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <PhoneCall size={20} className="text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-red-800 mb-1">Estamos con vos</h3>
          <p className="text-sm text-red-700 mb-3">{message}</p>
          <p className="text-xs font-semibold text-red-800 mb-2">Recursos de ayuda inmediata:</p>
          <ul className="space-y-1">
            {resources.map((r, i) => (
              <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
