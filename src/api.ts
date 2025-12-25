export async function diagnosticarDominio(dominio: string) {
  const resp = await fetch(
    "https://diagnostico-backend-vercel.vercel.app/api/detector",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ dominio })
    }
  );

  if (!resp.ok) {
    throw new Error("Erro ao executar diagnóstico no backend");
  }

  const data = await resp.json();

  // 🔎 DEBUG — aparece no console do navegador
  console.log("Resposta do backend:", data);

  return data;
}
