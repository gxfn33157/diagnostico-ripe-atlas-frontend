import { useState } from "react";
import "./App.css";

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
  continente: string;
  pais: string;
  cidade: string;
  isp: string;
  status: string;
  rtt_ms: number | null;
}

interface GlobalPingSummaryResponse {
  target: string;
  status: string;
  summary: GlobalPingSummaryItem[];
}

function calcularStatusGeral(resultado: DiagnosticoResponse) {
  if (resultado.tcp.status !== "online") {
    return { label: "INDISPONÍVEL", className: "status-down" };
  }

  const probes = resultado.globalping?.probes ?? [];
  if (probes.length === 0) {
    return { label: "EM ANÁLISE", className: "status-warn" };
  }

  const falhas = probes.filter(
    (p) => p.status !== "finished" || p.rtt_ms === null
  ).length;

  const lentos = probes.filter(
    (p) => p.rtt_ms !== null && p.rtt_ms > 300
  ).length;

  const total = probes.length;

  if (falhas / total >= 0.5) {
    return { label: "INDISPONÍVEL", className: "status-down" };
  }

  if (lentos / total >= 0.3) {
    return { label: "INSTÁVEL", className: "status-warn" };
  }

  return { label: "OK", className: "status-ok" };
}

function App() {
  const [dominio, setDominio] = useState("");
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function diagnosticar() {
    if (!dominio) return;

    setLoading(true);
    setErro(null);
    setResultado(null);

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
    } catch {
      setErro("Erro ao executar diagnóstico");
    } finally {
      setLoading(false);
    }
  }

  const statusGeral = resultado ? calcularStatusGeral(resultado) : null;

  return (
    <div className="container">
      <h1>Diagnóstico de Acesso</h1>

      <div className="form">
        <input
          type="text"
          placeholder="ex: google.com"
          value={dominio}
          onChange={(e) => setDominio(e.target.value)}
        />
        <button onClick={diagnosticar} disabled={loading}>
          {loading ? "Diagnosticando..." : "Diagnosticar"}
        </button>
      </div>

      {erro && <p className="error">{erro}</p>}

      {resultado && statusGeral && (
        <div className={`status-geral ${statusGeral.className}`}>
          STATUS GERAL: {statusGeral.label}
        </div>
      )}

      {resultado && (
        <div className="resultado">
          <h2>{resultado.dominio}</h2>

          <h3>DNS</h3>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Valor</th>
                <th>TTL</th>
              </tr>
            </thead>
            <tbody>
              {resultado.dns.map((d, i) => (
                <tr key={i}>
                  <td>{d.type}</td>
                  <td>{d.address || d.value}</td>
                  <td>{d.ttl ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>TCP</h3>
          <table>
            <thead>
              <tr>
                <th>Porta</th>
                <th>Status</th>
                <th>Latência (ms)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{resultado.tcp.port}</td>
                <td>{resultado.tcp.status}</td>
                <td>{resultado.tcp.latency_ms ?? "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
