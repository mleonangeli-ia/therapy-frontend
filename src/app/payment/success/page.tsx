"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packId = searchParams.get("pack");
  const [status, setStatus] = useState<"loading" | "active" | "error">("loading");

  useEffect(() => {
    if (!packId) { router.replace("/dashboard"); return; }

    // Poll until pack is ACTIVE (webhook should run quickly)
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await api.get(`/payments/status/${packId}`);
        if (data.status === "ACTIVE") {
          setStatus("active");
          clearInterval(interval);
          setTimeout(() => router.push("/dashboard"), 3000);
        } else if (attempts >= 15) {
          clearInterval(interval);
          setStatus("error");
        }
      } catch {
        clearInterval(interval);
        setStatus("error");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [packId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <>
            <Loader2 size={48} className="animate-spin text-primary-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Confirmando pago...</h2>
            <p className="text-gray-500 mt-2">Esto puede tomar unos segundos</p>
          </>
        )}
        {status === "active" && (
          <>
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">¡Pago confirmado!</h2>
            <p className="text-gray-500 mt-2">Tu pack está activo. Redirigiendo...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={48} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Verificando tu pago</h2>
            <p className="text-gray-500 mt-2">
              Tu pago puede estar en proceso. Chequeá tu dashboard en unos minutos.
            </p>
            <Link href="/dashboard" className="btn-primary mt-5 inline-block">
              Ir al dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
