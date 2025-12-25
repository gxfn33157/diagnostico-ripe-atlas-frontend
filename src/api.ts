export async function diagnosticarDominio(dominio) {
  const resp = await fetch(
    "https://diagnostico-backend-vercel.vercel.app/api/detector",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dominio }),
    }
  );

  if (!resp.ok) {
    throw new Error("Erro na API");
  }

  return await resp.json();
}
