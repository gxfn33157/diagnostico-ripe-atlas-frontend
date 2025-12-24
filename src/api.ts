export async function diagnosticarDominio(dominio: string) {
  const response = await fetch(
    "https://diagnostico-backend-vercel.vercel.app/api/detector",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ dominio })
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao executar diagnóstico");
  }

  return response.json();
}
