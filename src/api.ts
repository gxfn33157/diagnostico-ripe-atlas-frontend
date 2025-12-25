const API_BASE = "https://diagnostico-backend-vercel.vercel.app/api";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function diagnosticarDominio(dominio: string) {
  // 1️⃣ Dispara o diagnóstico
  const startResp = await fetch(`${API_BASE}/detector`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dominio }),
  });

  if (!startResp.ok) {
    throw new Error("Falha ao iniciar diagnóstico");
  }

  let data = await startResp.json();

  console.log("Resposta inicial:", data);

  // 2️⃣ Se não precisar aguardar, retorna direto
  if (data.status !== "processing" || !data.globalping?.measurement_id) {
    return data;
  }

  const measurementId = data.globalping.measurement_id;

  // 3️⃣ Polling por até 30s
  const timeoutMs = 30000;
  const intervalMs = 5000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    await sleep(intervalMs);

    const summaryResp = await fetch(
      `${API_BASE}/globalping-summary/${measurementId}`
    );

    if (!summaryResp.ok) continue;

    const summaryData = await summaryResp.json();

    console.log("Polling Globalping:", summaryData);

    if (summaryData.status === "finished") {
      return {
        ...data,
        status: "finished",
        status_geral: "OK",
        globalping: summaryData,
        texto_noc: "",
      };
    }
  }

  // 4️⃣ Timeout amigável
  return {
    ...data,
    status: "timeout",
    status_geral: "Instável",
    texto_noc:
      "Medição Globalping demorou mais que o esperado. Tente novamente em alguns instantes.",
  };
}
