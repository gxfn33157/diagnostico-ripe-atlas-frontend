import { useEffect, useRef, useState } from "react";
import "./styles.css";

interface DNSRecord {
  type: string;
  address?: string;
  value?: string;
  ttl?: number;
}

interface TCPResult {
  status: string;
  port: number;
  latency_ms: number | null;
}

interface DiagnosticoResponse {
  dominio: string;
  status: string;
  origem: string;
  dns: DNSRecord[];
  tcp: TCPResult;
  globalping?: {
    measurement_id: string;
  };
  timestamp: string;
}

interface GlobalpingProbe {
  continent: string;
  country: string;
  city: string;
  isp: string;
  status: string;
  rtt_ms: number | null;
}

function App() {
  const [dominio, setDominio] = useState("");
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(null);
  const [globalping, setGlobalping] = useState<GlobalpingProbe[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);

  async function diagnosticar() {
    if (!dominio) return;

    setLoading(true);
    setErro(null);
    setResultado(null);
    setGlobalping([]);

    try {
      const res = await fetch(
        "https://diagnostico-backend-vercel.vercel.app/api/detector",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dominio }),
        }
      );

      if (!res.ok) throw new Error();

      const data: DiagnosticoResponse = await res.json();
      setResultado(data);

      if (data.globalping?.measurement_id) {
        iniciarPolling(data.globalping.measurement_id);
      }
    } catch {
      setErro("Erro ao executar diagnóstico");
    } finally {
      setLoading(false);
    }
  }

  function iniciarPolling(measurementId: string) {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(
          `https://diagnostico-backend-vercel.vercel.app/api/globalping-summary/${measurementId}`
        );

        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "finished") {
          clearInterval(intervalRef.current!);
          setGlobalping(data.summary);
        }
      } catch {}
    }, 5000);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="container">
      <h1>Diagnóstico de Acesso</h1>

      <div className="form">
        <input
          placeholder="ex: youtube.com"
          value={dominio}
          onChange={(e) => setDominio(e.target.value)}
        />
        <button onClick={diagnosticar} disabled={loading}>
          {loading ? "Diagnosticando..." : "Diagnosticar"}
        </button>
      </div>

      {erro && <p className="error">{erro}</p>}

      {globalping.length > 0 && (
        <>
          <h3>Globalping — Teste Global</h3>

          <table>
            <thead>
              <tr>
                <th>Continente</th>
                <th>País</th>
                <th>Cidade</th>
                <th>ISP</th>
                <th>Status</th>
                <th>RTT (ms)</th>
              </tr>
            </thead>
            <tbody>
              {globalping.map((p, i) => (
                <tr key={i}>
                  <td>{p.continent}</td>
                  <td>{p.country}</td>
                  <td>{p.city}</td>
                  <td>{p.isp}</td>
                  <td className={p.status === "finished" ? "ok" : "error"}>
                    {p.status}
                  </td>
                  <td>{p.rtt_ms ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
