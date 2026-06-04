const STORAGE_KEY = "tv_corporativa_dados";
const UPDATE_KEY = "tv_corporativa_update";

let dadosPadrao = null;
let dados = null;

async function iniciarAdmin() {
  dadosPadrao = await buscarDadosPadrao();
  dados = carregarDados();

  preencherFormulario();
  configurarEventos();
}

async function buscarDadosPadrao() {
  try {
    const resposta = await fetch("dados.json");
    return await resposta.json();
  } catch (erro) {
    return {
      empresa: {
        nome: "TV Corporativa",
        slogan: "Comunicação interna simples e profissional",
        logoTexto: "TV",
        clima: "24°C",
        local: "Ambiente corporativo"
      },
      slides: [],
      avisos: [],
      aniversariantes: [],
      indicador: {
        valor: "100%",
        texto: "Comunicação ativa"
      },
      ticker: []
    };
  }
}

function carregarDados() {
  const salvo = localStorage.getItem(STORAGE_KEY);

  if (salvo) {
    try {
      return JSON.parse(salvo);
    } catch (erro) {
      return dadosPadrao;
    }
  }

  return dadosPadrao;
}

function preencherFormulario() {
  document.getElementById("empresaNome").value = dados.empresa.nome || "";
  document.getElementById("empresaLogo").value = dados.empresa.logoTexto || "";
  document.getElementById("empresaSlogan").value = dados.empresa.slogan || "";
  document.getElementById("empresaClima").value = dados.empresa.clima || "";
  document.getElementById("empresaLocal").value = dados.empresa.local || "";

  document.getElementById("avisosTexto").value = (dados.avisos || []).join("\n");
  document.getElementById("aniversariantesTexto").value = (dados.aniversariantes || []).join("\n");
  document.getElementById("tickerTexto").value = (dados.ticker || []).join("\n");

  document.getElementById("indicadorValor").value = dados.indicador?.valor || "";
  document.getElementById("indicadorTexto").value = dados.indicador?.texto || "";

  renderizarSlides();
}

function renderizarSlides() {
  const container = document.getElementById("slidesContainer");
  container.innerHTML = "";

  (dados.slides || []).forEach((slide, index) => {
    const div = document.createElement("div");
    div.className = "slide-editor";
    div.dataset.index = index;

    div.innerHTML = `
      <div class="slide-editor-header">
        <strong>Comunicado ${index + 1}</strong>
        <button class="remove-slide" type="button" data-remove="${index}">Remover</button>
      </div>

      <div class="form-grid">
        <label>
          Tag
          <input type="text" data-field="tag" value="${escapar(slide.tag || "")}">
        </label>

        <label>
          Categoria
          <input type="text" data-field="categoria" value="${escapar(slide.categoria || "")}">
        </label>

        <label>
          Título
          <input type="text" data-field="titulo" value="${escapar(slide.titulo || "")}">
        </label>

        <label>
          URL da imagem opcional
          <input type="text" data-field="imagem" value="${escapar(slide.imagem || "")}" placeholder="https://...">
        </label>
      </div>

      <label style="margin-top:16px;">
        Texto
        <textarea rows="4" data-field="texto">${escapar(slide.texto || "")}</textarea>
      </label>
    `;

    container.appendChild(div);
  });

  document.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.remove);
      dados.slides.splice(index, 1);
      renderizarSlides();
    });
  });
}

function coletarDados() {
  const slides = [];

  document.querySelectorAll(".slide-editor").forEach((editor) => {
    const slide = {};

    editor.querySelectorAll("[data-field]").forEach((campo) => {
      slide[campo.dataset.field] = campo.value.trim();
    });

    slides.push(slide);
  });

  return {
    empresa: {
      nome: document.getElementById("empresaNome").value.trim(),
      logoTexto: document.getElementById("empresaLogo").value.trim(),
      slogan: document.getElementById("empresaSlogan").value.trim(),
      clima: document.getElementById("empresaClima").value.trim(),
      local: document.getElementById("empresaLocal").value.trim()
    },
    slides,
    avisos: linhasParaArray(document.getElementById("avisosTexto").value),
    aniversariantes: linhasParaArray(document.getElementById("aniversariantesTexto").value),
    indicador: {
      valor: document.getElementById("indicadorValor").value.trim(),
      texto: document.getElementById("indicadorTexto").value.trim()
    },
    ticker: linhasParaArray(document.getElementById("tickerTexto").value)
  };
}

function salvar() {
  dados = coletarDados();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  localStorage.setItem(UPDATE_KEY, Date.now().toString());

  mostrarToast();
}

function restaurarPadrao() {
  const confirmar = confirm("Deseja restaurar o conteúdo padrão? Isso apagará as alterações salvas neste navegador.");

  if (!confirmar) return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(UPDATE_KEY, Date.now().toString());

  dados = JSON.parse(JSON.stringify(dadosPadrao));
  preencherFormulario();
  mostrarToast("Conteúdo padrão restaurado!");
}

function baixarJSON() {
  const conteudo = JSON.stringify(coletarDados(), null, 2);
  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "dados-tv-corporativa.json";
  a.click();

  URL.revokeObjectURL(url);
}

function adicionarSlide() {
  dados.slides.push({
    tag: "Comunicado",
    titulo: "Novo comunicado",
    texto: "Digite aqui o texto do comunicado.",
    categoria: "Comunicação interna",
    imagem: ""
  });

  renderizarSlides();
}

function configurarEventos() {
  document.getElementById("btnSalvar").addEventListener("click", salvar);
  document.getElementById("btnSalvarFinal").addEventListener("click", salvar);
  document.getElementById("btnRestaurar").addEventListener("click", restaurarPadrao);
  document.getElementById("btnBaixar").addEventListener("click", baixarJSON);
  document.getElementById("btnAddSlide").addEventListener("click", adicionarSlide);
}

function linhasParaArray(texto) {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);
}

function mostrarToast(texto = "Alterações salvas com sucesso!") {
  const toast = document.getElementById("toast");
  toast.textContent = texto;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function escapar(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

iniciarAdmin();
