const API_BASE = 'https://diagnostico-backend-samz.onrender.com/diagnostico';

export async function diagnosticar(dominio: string, traceroute: boolean) {
  const response = await fetch(`${API_BASE}/`, {  // <--- rota correta
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dominio, traceroute }) // usar mesmo payload do backend
  });

  const text = await response.text();
  console.log('Status do backend:', response.status);
  console.log('Resposta do backend:', text);

  if (!response.ok) throw new Error('Erro ao executar diagnóstico');
  return JSON.parse(text);
}
