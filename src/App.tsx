import { useEffect, useState } from "react";
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

interface GlobalPingSummary {
  target: string;
  status: string;
  summary: GlobalPingProbe[];
}

function App() {
  const [dominio, setDominio] = useState("");
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(null);
  const [globalpingFinal, setGlobalpingFinal] =
    useState<GlobalPingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function diagnosticar() {
    if (!dominio) return;

    setLoading(true);
    setErro(null);
    setResultado(null);
    setGlobalpingFinal(null);

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

  // 🔁 AUTO-REFRESH DO GLOBALPING
  useEffect(() => {
    if (!resultado?.globalping?.measurement_id) return;

    const id = resultado.globalping.measurement_id;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `https://diagnostico-backend-vercel.vercel.app/api/globalping-summary/${id}`
        );

        if (!res.ok) return;

        const data: GlobalPingSummary = await res.json();

        if (data.status === "finished") {
          setGlobalpingFinal(data);
          clearInterval(interval);
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [resultado]);

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
                <td
                  className={
                    resultado.tcp.status === "online" ? "ok" : "error"
                  }
                >
                  {resultado.tcp.status}
                </td>
                <td>{resultado.tcp.latency_ms ?? "-"}</td>
              </tr>
            </tbody>
          </table>

          <h3>Globalping</h3>

          {!globalpingFinal && (
            <p className="info">
              ⏳ Aguardando medições globais (auto-atualizando)…
            </p>
          )}

          {globalpingFinal && (
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
                {globalpingFinal.summary.map((p, i) => (
                  <tr key={i}>
                    <td>{p.continente}</td>
                    <td>{p.pais}</td>
                    <td>{p.cidade}</td>
                    <td>{p.isp}</td>
                    <td className="ok">{p.status}</td>
                    <td>{p.rtt_ms ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="timestamp">
            Executado em: {new Date(resultado.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
