import { useState } from "react";
import "./styles.css";

interface DiagnosticoResponse {
  dominio: string;
  status_geral: string;
  problema_rota_internacional: boolean;
  continentes: Record<string, any>;
  texto_noc: string;
  globalping?: {
    measurement_id?: string;
  };
  timestamp: string;
}

function App() {
  const [dominio, setDominio] = useState("");
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  async function diagnosticar() {
    if (!dominio) return;

    setLoading(true);
    setErro(null);
    setResultado(null);
    setProgress(0);

    try {
      // 1️⃣ Chamada inicial
      const res = await fetch(
        "https://diagnostico-backend-vercel.vercel.app/api/detector",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dominio }),
        }
      );

      const data: DiagnosticoResponse = await res.json();
      setResultado(data);

      const measurementId = data.globalping?.measurement_id;
      if (!measurementId) {
        setLoading(false);
        return;
      }

      // 2️⃣ Polling Globalping (até 30s)
      let elapsed = 0;
      const interval = 5000;
      const maxTime = 30000;

      const timer = setInterval(async () => {
        elapsed += interval;
        setProgress(Math.min((elapsed / maxTime) * 100, 100));

        const gp = await fetch(
          `https://diagnostico-backend-vercel.vercel.app/api/globalping-summary/${measurementId}`
        ).then(r => r.json());

        if (gp.status === "finished") {
          clearInterval(timer);

          setResultado(prev =>
            prev
              ? {
                  ...prev,
                  continentes: gp.continentes ?? {},
                  status_geral: gp.status_geral ?? prev.status_geral,
                  texto_noc: gp.texto_noc ?? prev.texto_noc,
                }
              : prev
          );

          setProgress(100);
          setLoading(false);
        }

        if (elapsed >= maxTime) {
          clearInterval(timer);
          setLoading(false);
        }
      }, interval);

    } catch {
      setErro("Erro ao executar diagnóstico");
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Diagnóstico de Acesso</h1>

      <div className="form">
        <input
          placeholder="ex: youtube.com"
          value={dominio}
          onChange={e => setDominio(e.target.value)}
        />
        <button onClick={diagnosticar} disabled={loading}>
          {loading ? "Diagnosticando..." : "Diagnosticar"}
        </button>
      </div>

      {loading && (
        <div className="progress">
          <div className="bar" style={{ width: `${progress}%` }} />
          <span>{Math.round(progress)}%</span>
        </div>
      )}

      {erro && <p className="error">{erro}</p>}

      {resultado && (
        <div className="resultado">
          <h2>{resultado.dominio}</h2>

          <p className={`status ${resultado.status_geral.toLowerCase()}`}>
            Status geral: {resultado.status_geral}
          </p>

          <pre className="noc">{resultado.texto_noc}</pre>

          <p className="timestamp">
            Executado em:{" "}
            {new Date(resultado.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
