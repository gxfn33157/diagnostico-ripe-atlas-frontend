import { useState } from "react";

const BACKEND_URL =
  "https://diagnostico-backend-vercel.vercel.app/api/detector";

export default function App() {
  const [dominio, setDominio] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function executarDiagnostico() {
    setLoading(true);
    setResultado(null);
    setMensagem("Iniciando diagnóstico...");

    const inicio = Date.now();
    const TEMPO_MAX = 30000; // 30 segundos
    const INTERVALO = 5000; // 5 segundos

    async function consultar() {
      try {
        const resp = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dominio }),
        });

        if (!resp.ok) {
          throw new Error("Erro na API");
        }

        const data = await resp.json();
        console.log("Resposta backend:", data);

        setResultado(data);

        // Se já tem resultado final
        if (
          data.status_geral &&
          data.status_geral !== "Instável" &&
          data.texto_noc
        ) {
          setMensagem("Diagnóstico concluído");
          setLoading(false);
          return;
        }

        // Ainda processando
        if (Date.now() - inicio < TEMPO_MAX) {
          setMensagem("Aguardando medições globais...");
          setTimeout(consultar, INTERVALO);
        } else {
          setMensagem(
            "Medição ainda em processamento. Tente novamente em instantes."
          );
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setMensagem("Erro ao executar diagnóstico");
        setLoading(false);
      }
    }

    consultar();
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Diagnóstico de Conectividade</h2>

      <input
        type="text"
        placeholder="Digite o domínio (ex: youtube.com)"
        value={dominio}
        onChange={(e) => setDominio(e.target.value)}
        style={{ padding: 8, width: 300 }}
      />

      <br />
      <br />

      <button
        onClick={executarDiagnostico}
        disabled={loading || !dominio}
        style={{ padding: "8px 16px" }}
      >
        {loading ? "Diagnosticando..." : "Diagnosticar"}
      </button>

      <p>{mensagem}</p>

      {resultado && (
        <pre
          style={{
            background: "#f4f4f4",
            padding: 15,
            marginTop: 20,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          {JSON.stringify(resultado, null, 2)}
        </pre>
      )}
    </div>
  );
}
