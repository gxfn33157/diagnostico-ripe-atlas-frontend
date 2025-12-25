import "./styles.css";
import { diagnosticarDominio } from "./api.js";

const btn = document.getElementById("btn");
const dominioInput = document.getElementById("dominio");
const resultado = document.getElementById("resultado");
const loading = document.getElementById("loading");

btn.addEventListener("click", async () => {
  const dominio = dominioInput.value.trim();
  if (!dominio) return alert("Informe um domínio");

  resultado.innerHTML = "";
  loading.classList.remove("hidden");

  try {
    const data = await diagnosticarDominio(dominio);
    loading.classList.add("hidden");

    resultado.innerHTML = `
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
  } catch (e) {
    loading.classList.add("hidden");
    alert("Erro ao executar diagnóstico");
    console.error(e);
  }
});
