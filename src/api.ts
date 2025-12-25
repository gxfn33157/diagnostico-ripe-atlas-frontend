const BACKEND = "https://diagnostico-backend-vercel.vercel.app";

/**
 * Função principal chamada pelo site
 */
export async function diagnosticarDominio(dominio: string) {
  // 1️⃣ Dispara diagnóstico inicial
  const resp = await fetch(`${BACKEND}/api/detector`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dominio }),
  });

  if (!resp.ok) {
    throw new Error("Erro ao iniciar diagnóstico");
  }

  const inicial = await resp.json();
  console.log("Resposta inicial:", inicial);

  // Se não houver globalping, retorna direto
  if (!inicial.globalping?.measurement_id) {
    return inicial;
  }

  const measurementId = inicial.globalping.measurement_id;

  // 2️⃣ Aguarda o Globalping finalizar (polling)
  const resumo = await aguardarGlobalping(measurementId);

  // 3️⃣ Retorna tudo consolidado
  return {
    ...inicial,
    ...resumo,
  };
}

/**
 * Aguarda a finalização do Globalping
 */
async function aguardarGlobalping(
  measurementId: string,
  tentativas = 10,
  intervaloMs = 5000
): Promise<any> {
  for (let i = 1; i <= tentativas; i++) {
    console.log(`🔄 Verificando Globalping (${i}/${tentativas})`);

    const resp = await fetch(
      `${BACKEND}/api/globalping-summary/${measurementId}`
    );

    if (resp.ok) {
      const data = await resp.json();

      if (data.status === "finished") {
        console.log("✅ Globalping finalizado");
        return {
          continentes: data.continentes ?? {},
          status_geral: data.status_geral ?? "OK",
          problema_rota_internacional:
            data.problema_rota_internacional ?? false,
          texto_noc: data.texto_noc ?? "",
          globalping: data,
        };
      }
    }

    // Aguarda antes da próxima tentativa
    await new Promise((r) => setTimeout(r, intervaloMs));
  }

  // Timeout controlado (UX amigável)
  return {
    status_geral: "Instável",
    texto_noc:
      "Medição Globalping ainda em processamento. Aguarde alguns segundos e tente novamente.",
    continentes: {},
    globalping: {},
    problema_rota_internacional: false,
  };
}
