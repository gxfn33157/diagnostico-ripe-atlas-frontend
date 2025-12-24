import { useState } from "react";

export default function App() {
  const [dominio, setDominio] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function diagnosticar() {
    setLoading(true);
    setResultado(null);

    try {
      const res = await fetch(
        "https://diagnostico-backend-vercel.vercel.app/api/detector",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dominio })
        }
      );

      const data = await res.json();
      setResultado(data);
    } catch {
      setResultado({ error: "Falha ao executar diagnóstico" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Diagnóstico de Acesso</h1>

      <input
        placeholder="ex: google.com"
        value={dominio}
        onChange={(e) => setDominio(e.target.value)}
      />

      <button onClick={diagnosticar} disabled={loading || !dominio}>
        {loading ? "Diagnosticar..." : "Diagnosticar"}
      </button>

      {/* 🔹 PAINÉIS */}
      {resultado?.status === "ok" && (
        <div className="panels">
          <div className="panel ok">
            <strong>DNS</strong>
            <span>{Array.isArray(resultado.dns) ? "OK" : "Erro"}</span>
          </div>

          <div className={`panel ${resultado.tcp?.status === "online" ? "ok" : "error"}`}>
            <strong>TCP 443</strong>
            <span>
              {resultado.tcp?.status} ({resultado.tcp?.latency_ms} ms)
            </span>
          </div>

          <div className="panel ok">
            <strong>Globalping</strong>
            <span>
              {resultado.globalping?.probes?.length || 0} probes globais
            </span>
          </div>
        </div>
      )}

      {/* 🔹 TABELA GLOBALPING */}
      {resultado?.globalping?.probes && (
        <>
          <h2>Visão Global</h2>
          <table>
            <thead>
              <tr>
                <th>País</th>
                <th>Cidade</th>
                <th>ASN</th>
                <th>RTT (ms)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {resultado.globalping.probes.map((p: any, i: number) => (
                <tr key={i}>
                  <td>{p.country}</td>
                  <td>{p.city}</td>
                  <td>{p.asn}</td>
                  <td>{p.rtt ?? "-"}</td>
                  <td className={p.rtt < 100 ? "ok" : "warn"}>
                    {p.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 🔹 JSON FORMATADO */}
      {resultado && (
        <>
          <h2>Resposta Técnica (JSON)</h2>
          <pre>{JSON.stringify(resultado, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
