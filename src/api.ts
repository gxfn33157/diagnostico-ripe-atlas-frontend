export async function diagnosticarDominio(dominio: string) {
  const resp = await fetch(
    "https://diagnostico-backend-vercel.vercel.app/api/diagnostico",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dominio }),
    }
  );

  if (!resp.ok) {
    throw new Error("Erro na API");
  }

  const data = await resp.json();

  // 🔎 LOG DE DEBUG (aparece no console do navegador)
  console.log("Resposta completa do backend:", data);

  return {
    dominio: data.dominio,
    status: data.status,
    origem: data.origem,
    dns: data.dns ?? [],
    tcp: data.tcp ?? null,
    globalping: data.globalping ?? null,
    timestamp: data.timestamp,
  };
}
