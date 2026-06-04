const STORAGE_KEY = "tv_corporativa_dados";
const UPDATE_KEY = "tv_corporativa_update";

let dadosPadrao = null;
let dados = null;
let slideAtual = 0;

async function iniciarTV() {
  dadosPadrao = await buscarDadosPadrao();
  dados = carregarDados();

  aplicarDados();
  atualizarRelogio();

  setInterval(atualizarRelogio, 1000);
  setInterval(proximoSlide, 9000);
  setInterval(verificarAtualizacao, 2000);
}

async function buscarDadosPadrao() {
  try {
    const resposta = await fetch("dados.json");
    return await resposta.json();
  } catch (erro) {
    return dadosFallback();
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

function aplicarDados() {
  document.getElementById("empresaLogo").textContent = dados.empresa.logoTexto || "TV";
  document.getElementById("empresaNome").textContent = dados.empresa.nome || "TV Corporativa";
  document.getElementById("empresaSlogan").textContent = dados.empresa.slogan || "";
  document.getElementById("climaValor").textContent = dados.empresa.clima || "24°C";
  document.getElementById("climaCidade").textContent = dados.empresa.local || "Ambiente corporativo";

  renderizarListas();
  renderizarTicker();
  mostrarSlide();
}

function mostrarSlide() {
  if (!dados.slides || dados.slides.length === 0) return;

  const slide = dados.slides[slideAtual];
  const area = document.getElementById("slideArea");

  area.classList.remove("fade");
  void area.offsetWidth;

  document.getElementById("slideTag").textContent = slide.tag || "Comunicado";
  document.getElementById("slideTitulo").textContent = slide.titulo || "";
  document.getElementById("slideTexto").textContent = slide.texto || "";
  document.getElementById("slideCategoria").textContent = slide.categoria || "";
  document.getElementById("slideContador").textContent = `${slideAtual + 1} / ${dados.slides.length}`;

  if (slide.imagem && slide.imagem.trim() !== "") {
    area.style.backgroundImage = `url('${slide.imagem}')`;
    area.classList.add("has-image");
  } else {
    area.style.backgroundImage = "";
    area.classList.remove("has-image");
  }

  const proximoIndex = (slideAtual + 1) % dados.slides.length;
  const proximo = dados.slides[proximoIndex];

  document.getElementById("proximoTitulo").textContent = proximo.titulo || "Próximo comunicado";
  document.getElementById("proximoTexto").textContent = proximo.texto || "";

  area.classList.add("fade");
}

function proximoSlide() {
  if (!dados.slides || dados.slides.length === 0) return;

  slideAtual = (slideAtual + 1) % dados.slides.length;
  mostrarSlide();
}

function renderizarListas() {
  const listaAvisos = document.getElementById("listaAvisos");
  const listaAniversariantes = document.getElementById("listaAniversariantes");

  listaAvisos.innerHTML = "";
  listaAniversariantes.innerHTML = "";

  (dados.avisos || []).forEach((aviso) => {
    const li = document.createElement("li");
    li.textContent = aviso;
    listaAvisos.appendChild(li);
  });

  (dados.aniversariantes || []).forEach((nome) => {
    const li = document.createElement("li");
    li.textContent = nome;
    listaAniversariantes.appendChild(li);
  });

  document.getElementById("indicadorValor").textContent = dados.indicador?.valor || "100%";
  document.getElementById("indicadorTexto").textContent = dados.indicador?.texto || "Comunicação ativa";
}

function renderizarTicker() {
  const textos = dados.ticker || [];
  document.getElementById("tickerTexto").textContent = textos.join("   •   ");
}

function atualizarRelogio() {
  const agora = new Date();

  document.getElementById("horaAtual").textContent = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  document.getElementById("dataAtual").textContent = agora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function verificarAtualizacao() {
  const novo = carregarDados();

  if (JSON.stringify(novo) !== JSON.stringify(dados)) {
    dados = novo;
    slideAtual = 0;
    aplicarDados();
  }
}

document.getElementById("btnFullscreen").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

function dadosFallback() {
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

iniciarTV();
