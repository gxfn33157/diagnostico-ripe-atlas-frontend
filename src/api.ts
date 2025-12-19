const API_BASE = 'https://diagnostico-backend-samz.onrender.com/diagnostico'

export async function diagnosticar(dominio: string, escopo: string, limite: number) {
  const response = await fetch(`${API_BASE}/api/diagnosticar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dominio, escopo, limite })
  })

  if (!response.ok) {
    const text = await response.text(); // log para debug
    console.error('Erro do backend:', text);
    throw new Error('Erro ao executar diagnóstico');
  }

  return response.json();
}
