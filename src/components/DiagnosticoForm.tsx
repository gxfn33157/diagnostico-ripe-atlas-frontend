import { useState } from 'react'
import { diagnosticar } from '../api'

export default function DiagnosticoForm() {
  const [dominio, setDominio] = useState('')
  const [escopo, setEscopo] = useState('GLOBAL')
  const [limite, setLimite] = useState(10)
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await diagnosticar(dominio, escopo, limite)
      setResultado(data)
    } catch {
      alert('Erro ao executar diagnóstico')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input placeholder="Domínio" value={dominio} onChange={e => setDominio(e.target.value)} />
        <select value={escopo} onChange={e => setEscopo(e.target.value)}>
          <option value="GLOBAL">Global</option>
          <option value="BR">Brasil</option>
          <option value="AWS">AWS</option>
          <option value="AZURE">Azure</option>
        </select>
        <input type="number" value={limite} onChange={e => setLimite(Number(e.target.value))} />
        <button disabled={loading}>{loading ? 'Executando...' : 'Diagnosticar'}</button>
      </form>
      {resultado && <pre>{JSON.stringify(resultado, null, 2)}</pre>}
    </>
  )
}