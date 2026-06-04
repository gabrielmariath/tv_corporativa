const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORTA = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');
const BACKUP_DIR = path.join(__dirname, 'backups');
const DADOS_PATH = path.join(__dirname, 'dados.json');
const sessions = new Map();

for (const dir of [UPLOAD_DIR, BACKUP_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function rota(req) { return decodeURIComponent(req.url.split('?')[0]); }
function enviarJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj, null, 2));
}
function lerBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 15_000_000) reject(new Error('Arquivo muito grande'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
function lerDados() {
  if (!fs.existsSync(DADOS_PATH)) {
    fs.writeFileSync(DADOS_PATH, JSON.stringify({ config: { rodape: 'ID Móveis • Comunicação Interna', senhaAdmin: '1234', logo: '', banner: '', bannerAtivo: false }, avisosGrandes: [], cardsLaterais: [], aniversariantes: [] }, null, 2), 'utf8');
  }
  const dados = JSON.parse(fs.readFileSync(DADOS_PATH, 'utf8'));
  if (!dados.config) {
    dados.config = { rodape: dados.rodape || 'ID Móveis • Comunicação Interna', senhaAdmin: dados.senhaAdmin || '1234', logo: '', banner: '', bannerAtivo: false };
    dados.avisosGrandes = (dados.avisosGrandes || []).map(a => typeof a === 'string' ? { texto: a, inicio: '', fim: '' } : a);
    dados.aniversariantes = dados.aniversariantes || [];
  }
  return dados;
}
function dadosPublicos() {
  const dados = lerDados();
  return {
    config: {
      rodape: dados.config.rodape,
      logo: dados.config.logo,
      banner: dados.config.banner,
      bannerAtivo: !!dados.config.bannerAtivo
    },
    avisosGrandes: dados.avisosGrandes || [],
    cardsLaterais: dados.cardsLaterais || [],
    aniversariantes: dados.aniversariantes || []
  };
}
function criarBackup(prefixo = 'backup') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const nome = `${prefixo}-${stamp}.json`;
  const destino = path.join(BACKUP_DIR, nome);
  fs.copyFileSync(DADOS_PATH, destino);
  return nome;
}
function salvarDados(payload) {
  const atual = lerDados();
  criarBackup('automatico');
  const novo = {
    config: {
      rodape: typeof payload.config?.rodape === 'string' ? payload.config.rodape : atual.config.rodape,
      senhaAdmin: atual.config.senhaAdmin || '1234',
      logo: typeof payload.config?.logo === 'string' ? payload.config.logo : atual.config.logo,
      banner: typeof payload.config?.banner === 'string' ? payload.config.banner : atual.config.banner,
      bannerAtivo: typeof payload.config?.bannerAtivo === 'boolean' ? payload.config.bannerAtivo : !!atual.config.bannerAtivo
    },
    avisosGrandes: Array.isArray(payload.avisosGrandes) ? payload.avisosGrandes : atual.avisosGrandes,
    cardsLaterais: Array.isArray(payload.cardsLaterais) ? payload.cardsLaterais : atual.cardsLaterais,
    aniversariantes: Array.isArray(payload.aniversariantes) ? payload.aniversariantes : atual.aniversariantes
  };
  fs.writeFileSync(DADOS_PATH, JSON.stringify(novo, null, 2), 'utf8');
  return novo;
}
function cookie(req, nome) {
  const c = req.headers.cookie || '';
  const item = c.split(';').map(x => x.trim()).find(x => x.startsWith(nome + '='));
  return item ? item.split('=').slice(1).join('=') : '';
}
function autenticado(req) {
  const token = cookie(req, 'tv_session');
  const sessao = token && sessions.get(token);
  if (!sessao) return false;
  if (Date.now() > sessao.expira) { sessions.delete(token); return false; }
  sessao.expira = Date.now() + 8 * 60 * 60 * 1000;
  return true;
}
function salvarImagem(dataUrl, tipo) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return '';
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) throw new Error('Formato de imagem inválido. Use PNG, JPG ou WEBP.');
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 8_000_000) throw new Error('Imagem muito grande. Use até 8 MB.');
  const nome = `${tipo}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, nome), buffer);
  return `/uploads/${nome}`;
}
function contentType(arquivo) {
  const ext = path.extname(arquivo).toLowerCase();
  return { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.pdf':'application/pdf', '.txt':'text/plain; charset=utf-8' }[ext] || 'application/octet-stream';
}

const server = http.createServer(async (req, res) => {
  try {
    const r = rota(req);

    if (req.method === 'POST' && r === '/api/login') {
      const payload = JSON.parse(await lerBody(req) || '{}');
      const dados = lerDados();
      if (payload.senha !== dados.config.senhaAdmin) return enviarJson(res, 401, { erro: 'Senha incorreta.' });
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { expira: Date.now() + 8 * 60 * 60 * 1000 });
      res.setHeader('Set-Cookie', `tv_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`);
      return enviarJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && r === '/api/logout') {
      const token = cookie(req, 'tv_session');
      if (token) sessions.delete(token);
      res.setHeader('Set-Cookie', 'tv_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      return enviarJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && r === '/api/session') return enviarJson(res, 200, { autenticado: autenticado(req) });

    if (req.method === 'GET' && r === '/api/dados') return enviarJson(res, 200, dadosPublicos());

    if (req.method === 'GET' && r === '/api/admin/dados') {
      if (!autenticado(req)) return enviarJson(res, 401, { erro: 'Faça login.' });
      return enviarJson(res, 200, dadosPublicos());
    }

    if (req.method === 'POST' && r === '/api/admin/dados') {
      if (!autenticado(req)) return enviarJson(res, 401, { erro: 'Faça login novamente.' });
      const payload = JSON.parse(await lerBody(req) || '{}');
      const atual = lerDados();
      if (payload.logoDataUrl) payload.config.logo = salvarImagem(payload.logoDataUrl, 'logo');
      else if (!payload.config?.logo) payload.config = { ...(payload.config || {}), logo: atual.config.logo };
      if (payload.bannerDataUrl) payload.config.banner = salvarImagem(payload.bannerDataUrl, 'banner');
      else if (!payload.config?.banner) payload.config = { ...(payload.config || {}), banner: atual.config.banner };
      const salvo = salvarDados(payload);
      return enviarJson(res, 200, { ok: true, dados: dadosPublicos() });
    }

    if (req.method === 'POST' && r === '/api/admin/backup') {
      if (!autenticado(req)) return enviarJson(res, 401, { erro: 'Faça login.' });
      const nome = criarBackup('manual');
      return enviarJson(res, 200, { ok: true, arquivo: nome, url: `/backups/${nome}` });
    }

    if (req.method === 'GET' && r.startsWith('/backups/')) {
      if (!autenticado(req)) return enviarJson(res, 401, { erro: 'Faça login.' });
      const nome = path.basename(r);
      const arquivo = path.join(BACKUP_DIR, nome);
      if (!arquivo.startsWith(BACKUP_DIR) || !fs.existsSync(arquivo)) { res.writeHead(404); return res.end('Backup não encontrado'); }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="${nome}"` });
      return fs.createReadStream(arquivo).pipe(res);
    }

    let urlPath = r;
    if (urlPath === '/') urlPath = '/index.html';
    if (urlPath === '/admin') urlPath = '/admin.html';
    const arquivo = path.join(PUBLIC_DIR, urlPath);
    if (!arquivo.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Acesso negado'); }
    fs.readFile(arquivo, (erro, conteudo) => {
      if (erro) { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); return res.end('Arquivo não encontrado'); }
      res.writeHead(200, { 'Content-Type': contentType(arquivo), 'Cache-Control':'no-store' });
      res.end(conteudo);
    });
  } catch (e) {
    return enviarJson(res, 500, { erro: e.message || 'Erro interno.' });
  }
});

server.listen(PORTA, '0.0.0.0', () => {
  console.log('');
  console.log('=======================================');
  console.log(' TV Corporativa ID Móveis - PRO');
  console.log('=======================================');
  console.log(` Tela da TV:     http://localhost:${PORTA}`);
  console.log(` Painel do RH:   http://localhost:${PORTA}/admin`);
  console.log(' Em outro PC da rede, use o IP deste computador.');
  console.log('=======================================');
  console.log('');
});
