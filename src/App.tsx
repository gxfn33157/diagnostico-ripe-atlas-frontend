import { useState } from "react";

function gerarDiagnostico(data: any) {
  if (!data || data.status !== "ok") {
    return {
      nivel: "error",
      mensagem: "Falha ao executar diagnóstico"
    };
  }

  // DNS
  if (!Array.isArray(data.dns) || data.dns.length === 0) {
    return {
      nivel: "error",
      mensagem: "Falha de DNS — domínio não resolve corretamente"
    };
  }

  // TCP
  if (data.tcp?.status !== "online") {
    return {
      nivel: "error",
      mensagem: "Serviço inacessível na porta 443"
    };
  }

  // Globalping
  const probes = data.globalping?.probes || [];
  const probesComRTT = probes.filter((p: any) => typeof p.rtt === "number");

  if (probesComRTT.length === 0) {
    return {
      nivel: "warn",
      mensagem: "Sem resposta global — possível bloqueio regional"
    };
  }

  const latenciaAlta = probesComRTT.filter((p: any) => p.rtt > 200);

  if (latenciaAlta.length > probesComRTT.length * 0.4) {
    return {
      nivel: "warn",
      mensagem: "Latência elevada em múltiplas regiões (possível problema de rota)"
    };
  }

  return {
    nivel: "ok",
    mensagem: "Serviço acessível globalmente"
  };
}

export default function App() {
  const [dominio, setDominio] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(f
