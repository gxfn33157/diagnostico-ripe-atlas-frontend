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

interface GlobalPingProbe {
  continente: string;
  pais: string;
  cidade: string;
  isp: string;
  status: string;
  rtt_ms: number | null;
}

interface GlobalPingResult {
  measurement_id: string;
  probes: GlobalPingProbe[];
}

interface DiagnosticoResponse {
  dominio: string;
  status: string;
  origem: string;
  dns: DNSRecord[];
  tcp: TCPResult;
  globalping?: GlobalPingResult;
  timestamp: string;
}

interface GlobalPingSummaryItem {
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
  const [globalping, setGlobalping] = useState<GlobalPingSummaryItem[]>([]);
  const [statusGeral, setStatusGeral] = useState<
    "OK" | "Instável" | "Indisponível" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);

  async function diagnosticar() {
    if (!dominio) return;

    setLoading(true);
    setErro(null);
    setResultado(null);
    setGlobalping([]);
    setStatusGeral(null);

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
        iniciarPollingGlobalping(data.globalping.measurement_id);
      }
    } catch {
      setErro("Erro ao executar diagnóstico");
    } finally {
      setLoading(false);
    }
  }

  function iniciarPollingGlobalping(measurementId: string) {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(
          `https://diagnostico-backend-vercel.vercel.app/api/globalping-summary/${measurementId}`
        );

        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "finished") {
          clearInterval(pollingRef.current!);

          const probes: GlobalPingSummaryItem[] = data.summary.map((p: any) => ({
            continent: p.continent,
            country: p.country,
            city: p.city,
            isp: p.isp,
            status: p.status,
            rtt_ms: p.rtt_ms ?? null,
          }));

          setGlobalping(probes);
          calcularStatusGeral(probes);
        }
      } catch {
        // ignora erro temporário
      }
    }, 5000);
  }

  function calcularStatusGeral(probes: GlobalPingSummaryItem[]) {
    const total = probes.length;
    const falhas = probes.filter(
      (p) => p.status !== "finished" || p.rtt_ms === null
    ).length;

    if (falhas === 0) setStatusGeral("OK");
    else if (falhas / total < 0.4) setStatusGeral("Instável");
    else setStatusGeral("Indisponível");
  }

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <div className="container">
      <h1>Diagnóstico de Acesso</h1>

      <div className="form">
        <input
          type="text"
          placeholder="ex: youtube.com"
          value={dominio}
          onChange={(e) => setDominio(e.target.value)}
        />
        <button onClick={diagnosticar} disabled={loading}>
          {loading ? "Diagnosticando..." : "Diagnosticar"}
        </button>
      </div>

      {erro && <p className="error">{erro}</p>}

      {statusGeral && (
        <div className={`status-geral ${statusGeral.toLowerCase()}`}>
          Status Geral: {statusGeral}
        </div>
      )}

      {globalping.length > 0 && (
        <>
          <h3>Globalping – Teste Global</h3>

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
