let dados = null;
let slideAtual = 0;

async function carregarDados() {
  try {
    const resposta = await fetch("dados.json");
    dados = await resposta.json();

    configurarEmpresa();
    renderizarListas();
    renderizarTicker();
    mostrarSlide();

    setInterval(proximoSlide, 9000);
    setInterval(atualizarRelogio, 1000);

    atualizarRelogio();
  } catch (erro) {
    console.error("Erro ao carregar dados.json:", erro);
  }
}

function configurarEmpresa() {
  document.getElementById("empresaNome").textContent = dados.empresa.nome;
  document.getElementById("empresaSlogan").textContent = dados.empresa.slogan;
  document.getElementById("empresaLogo").textContent = dados.empresa.logoTexto;
}

function mostrarSlide() {
  const slide = dados.slides[slideAtual];

  const area = document.querySelector(".main-slide");
  area.classList.remove("fade");

  void area.offsetWidth;

  document.getElementById("slideTag").textContent = slide.tag;
  document.getElementById("slideTitulo").textContent = slide.titulo;
  document.getElementById("slideTexto").textContent = slide.texto;
  document.getElementById("slideCategoria").textContent = slide.categoria;
  document.getElementById("slideContador").textContent = `${slideAtual + 1} / ${dados.slides.length}`;

  area.classList.add("fade");
}

function proximoSlide() {
  slideAtual++;

  if (slideAtual >= dados.slides.length) {
    slideAtual = 0;
  }

  mostrarSlide();
}

function renderizarListas() {
  const listaAvisos = document.getElementById("listaAvisos");
  const listaAniversariantes = document.getElementById("listaAniversariantes");

  listaAvisos.innerHTML = "";
  listaAniversariantes.innerHTML = "";

  dados.avisos.forEach((aviso) => {
    const li = document.createElement("li");
    li.textContent = aviso;
    listaAvisos.appendChild(li);
  });

  dados.aniversariantes.forEach((nome) => {
    const li = document.createElement("li");
    li.textContent = nome;
    listaAniversariantes.appendChild(li);
  });

  document.getElementById("indicadorValor").textContent = dados.indicador.valor;
  document.getElementById("indicadorTexto").textContent = dados.indicador.texto;
}

function renderizarTicker() {
  document.getElementById("tickerTexto").textContent = dados.ticker.join("   •   ");
}

function atualizarRelogio() {
  const agora = new Date();

  const hora = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const data = agora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  document.getElementById("horaAtual").textContent = hora;
  document.getElementById("dataAtual").textContent = data;
}

document.getElementById("btnFullscreen").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

carregarDados();
