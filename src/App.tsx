import { useState } from "react";

/* =======================
   TIPOS
======================= */

interface DNSRecord {
  address?: string;
  value?: string;
  ttl?: number;
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
  dns: DNSRecord[];
  tcp: TCPInfo;
  globalping: {
    measurement_id: string;
    probes: GlobalPingProbe[];
  };
}

interface GlobalPingSummaryResponse {
  status: string;
  summary: GlobalPingProbe[];
}

/* =======================
   COMPONENTE
======================= */

export default function App() {
  const [dominio, setDominio] = useState("");
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function diagnosticar() {
    setLoading(true);
    setResultado(null);
    setMsg("Executando diagnóstico...");

    try {
      // 1️⃣ Diagnóstico inicial
      const res = await fetch(
        "https://diagnostico-backend-vercel.vercel.app/api/detector",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dominio }),
        }
      );

      const data: DiagnosticoResponse = await res.json();

      setMsg("Aguardando resultados globais...");
      data.globalping.probes = [];

      setResultado({ ...data });

      // 2️⃣ Polling do Globalping
      const measurementId = data.globalping.measurement_id;

      for (let i = 0; i < 7; i++) {
        await new Promise((r) => setTimeout(r, 3000));

        const summaryRes = await fetch(
          `https://diagnostico-backend-vercel.vercel.app/api/globalping-summary/${measurementId}`
        );

        if (!summaryRes.ok) continue;

        const summary: GlobalPingSummaryResponse =
          await summaryRes.json();

        if (summary.status === "finished" && summary.summary.length > 0) {
          data.globalping.probes = summary.summary;
          setResultado({ ...data });
          setMsg("Diagnóstico global concluído ✅");
          break;
        }
      }
    } catch {
      setMsg("Erro ao executar diagnóstico");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Diagnóstico de Acesso</h1>

      <input
        value={dominio}
        onChange={(e) => setDominio(e.target.value)}
        placeholder="ex: youtube.com"
      />

      <button onClick={diagnosticar} disabled={loading}>
        {loading ? "Aguarde..." : "Diagnosticar"}
      </button>

      <p>{msg}</p>

      {resultado && (
        <div className="resultado">
          <h2>{resultado.dominio}</h2>

          <h3>DNS</h3>
          <ul>
            {resultado.dns.map((d, i) => (
              <li key={i}>
                {d.type} — {d.address || d.value}
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
            <p>Coletando medições globais...</p>
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
