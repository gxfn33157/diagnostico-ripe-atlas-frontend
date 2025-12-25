import { useState } from "react";

/* =======================
   TIPAGENS
======================= */

interface DNSRecord {
  address: string;
  ttl: number;
  type: string;
}

interface TCPInfo {
  status: string;
  port: number;
  latency_ms: number;
}

interface GlobalPingProbe {
  continente: string;
  pais: string;
  cidade: string;
  isp: string;
  status: string;
  rtt_ms: number | null;
}

interface DiagnosticoResponse {
  dominio: string;
  status: string;
  origem: string;
  dns: DNSRecord[];
  tcp: TCPInfo;
  globalping: {
    measurement_id: string;
    probes: GlobalPingProbe[];
  };
  timestamp: string;
}

interface GlobalPingSummaryResponse {
  target: string;
  status: string;
  summary: GlobalPingProbe[];
}

/* =======================
   COMPONENTE
======================= */

export default function App() {
  const [dominio, setDominio] = useState("");
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function diagnosticar() {
    if (!dominio) return;

    setLoading(true);
    setErro(null);
    setResultado(null);

    try {
      // 1️⃣ Chama o backend principal
      const res = await fetch(
        "https://diagnostico-backend-vercel.vercel.app/api/detector",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dominio }),
        }
      );

      if (!res.ok) {
        throw new Error("Erro ao consultar backend");
      }

      const data: DiagnosticoResponse = await res.json();

      // 2️⃣ Busca o summary do Globalping
      if (data.globalping?.measurement_id) {
        const summaryRes = await fetch(
          `https://diagnostico-backend-vercel.vercel.app/api/globalping-summary/${data.globalping.measurement_id}`
        );

        if (summaryRes.ok) {
          const summaryData: GlobalPingSummaryResponse =
            await summaryRes.json();

          data.globalping.probes = summaryData.summary;
        }
      }

      setResultado(data);
    } catch (e) {
      setErro("Erro ao executar diagnóstico");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Diagnóstico de Acesso</h1>

      <input
        type="text"
        placeholder="ex: youtube.com"
        value={dominio}
        onChange={(e) => setDominio(e.target.value)}
      />

      <button onClick={diagnosticar} disabled={loading}>
        {loading ? "Diagnosticando..." : "Diagnosticar"}
      </button>

      {erro && <p className="erro">{erro}</p>}

      {resultado && (
        <div className="resultado">
          <h2>{resultado.dominio}</h2>

          <p>
            <strong>Status:</strong> {resultado.status}
          </p>

          <h3>DNS</h3>
          <ul>
            {resultado.dns.map((r, i) => (
              <li key={i}>
                {r.type} — {r.address} (TTL {r.ttl})
              </li>
            ))}
          </ul>

          <h3>TCP</h3>
          <p>
            Porta {resultado.tcp.port} — {resultado.tcp.status} —{" "}
            {resultado.tcp.latency_ms} ms
          </p>

          <h3>Globalping</h3>

          {resultado.globalping.probes.length === 0 ? (
            <p>Nenhum resultado global disponível.</p>
          ) : (
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
                {resultado.globalping.probes.map((p, i) => (
                  <tr key={i}>
                    <td>{p.continente}</td>
                    <td>{p.pais}</td>
                    <td>{p.cidade}</td>
                    <td>{p.isp}</td>
                    <td>{p.status}</td>
                    <td>{p.rtt_ms ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
