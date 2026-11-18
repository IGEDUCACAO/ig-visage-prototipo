/* Identidade visual oficial da Ilda Guimarães — paleta, tipografia e logo.
   Node puro (node:test + node:assert), sem dependências.
   Uso: node --test testes/estilo.test.js */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const CSS_PATH = path.join(RAIZ, 'assets', 'styles.css');
const HTML_PATH = path.join(RAIZ, 'index.html');
const FONTES_DIR = path.join(RAIZ, 'assets', 'fontes');
const LOGO_PATH = path.join(RAIZ, 'assets', 'marca', 'art-visage-horizontal.png');

const css = fs.readFileSync(CSS_PATH, 'utf8');
const html = fs.readFileSync(HTML_PATH, 'utf8');

const CORES = [
  '#431c5b',
  '#db6a37',
  '#064276',
  '#8c1f3d',
  '#f0c43f',
  '#40535d',
  '#161f28',
  '#dbdbd3'
];

const escapar = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function blocoDaRegra(fonte, seletor) {
  const re = new RegExp('(?:^|\\n)[ \\t]*' + escapar(seletor) + '[ \\t]*\\{([\\s\\S]*?)\\}');
  const achado = fonte.match(re);
  return achado ? achado[1] : null;
}

function faces(fonte) {
  return Array.from(fonte.matchAll(/@font-face\s*\{([\s\S]*?)\}/g), (m) => m[1]);
}

function urlsDeFonte(face) {
  return Array.from(face.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g), (m) => m[1]);
}

/* Retorna cada src que não aponta para um arquivo local não-vazio. */
function fontesAusentes(fonte, diretorioCss) {
  const faltando = [];
  for (const face of faces(fonte)) {
    for (const url of urlsDeFonte(face)) {
      if (/^(https?:)?\/\//.test(url)) {
        faltando.push(url + ' (fonte remota, proibida)');
        continue;
      }
      const absoluto = path.resolve(diretorioCss, url);
      if (!fs.existsSync(absoluto) || fs.statSync(absoluto).size === 0) {
        faltando.push(url);
      }
    }
  }
  return faltando;
}

test('styles.css declara as 8 cores institucionais em hexadecimal minúsculo', () => {
  for (const cor of CORES) {
    assert.ok(css.includes(cor), 'cor institucional ausente ou fora de minúsculo: ' + cor);
  }
  assert.match(css, /--roxo:\s*#431c5b/);
  assert.match(css, /--laranja:\s*#db6a37/);
  assert.match(css, /--azul:\s*#064276/);
  assert.match(css, /--vinho:\s*#8c1f3d/);
  assert.match(css, /--amarelo:\s*#f0c43f/);
  assert.match(css, /--bg:\s*#dbdbd3/);
});

test('a paleta antiga (bege/dourado/verde) foi removida', () => {
  assert.ok(!/#a9855a/i.test(css), 'o dourado antigo #a9855a ainda aparece no CSS');
  assert.ok(!/#2f6b4f/i.test(css), 'o verde antigo #2f6b4f ainda aparece no CSS');
  for (const variavel of ['--gold', '--gold-d', '--terra', '--terra-d', '--verde', '--label']) {
    assert.ok(
      !new RegExp(escapar(variavel) + '\\s*:').test(css),
      'a variável antiga ' + variavel + ' ainda é declarada'
    );
    assert.ok(
      !css.includes('var(' + variavel + ')'),
      'a variável antiga ' + variavel + ' ainda é usada'
    );
  }
});

test('títulos usam BT Suave em roxo; Georgia fica só como fallback', () => {
  const serif = css.match(/--serif:\s*([^;]+);/);
  assert.ok(serif, 'styles.css precisa declarar --serif');
  assert.match(serif[1].trim(), /^"BT Suave"/, '--serif deve começar por "BT Suave"');
  assert.match(serif[1], /Georgia/, 'falta o fallback Georgia/serif exigido pela marca');

  const titulos = css.match(/(?:^|\n)[ \t]*h1,\s*\n[ \t]*h2,\s*\n[ \t]*h3\s*\{([\s\S]*?)\}/);
  assert.ok(titulos, 'regra global de h1/h2/h3 não encontrada');
  assert.match(titulos[1], /font-family:\s*var\(--serif\)/, 'h1-h3 não usam a fonte de títulos');
  assert.match(titulos[1], /color:\s*var\(--roxo\)/, 'h1-h3 não usam o roxo institucional');
  assert.match(titulos[1], /font-weight:\s*700/);

  const titulo = blocoDaRegra(css, '.titulo');
  assert.ok(titulo, 'regra .titulo não encontrada');
  assert.match(titulo, /font-family:\s*var\(--serif\)/);
  assert.match(titulo, /color:\s*var\(--roxo\)/);

  const h2 = blocoDaRegra(css, '.tela h2');
  assert.match(h2, /letter-spacing:\s*-/, 'h2 precisa de letter-spacing levemente negativo');

  assert.ok(!/font-family\s*:\s*["']?Georgia/i.test(css), 'Georgia não pode ser fonte principal');
});

test('corpo usa Sora 16px com entrelinha 1.55', () => {
  const corpo = blocoDaRegra(css, 'body');
  assert.ok(corpo, 'regra body não encontrada');
  assert.match(corpo, /font-family:\s*var\(--sans\)/);
  assert.match(corpo, /font-size:\s*16px/);
  assert.match(corpo, /line-height:\s*1\.55/);
  assert.match(corpo, /color:\s*var\(--ink\)/);

  const sans = css.match(/--sans:\s*([^;]+);/);
  assert.match(sans[1].trim(), /^"Sora"/);
  assert.match(sans[1], /system-ui/, 'falta o fallback de sistema em --sans');
});

test('cada @font-face referencia um arquivo local que existe de fato', () => {
  const blocos = faces(css);
  assert.ok(blocos.length >= 3, 'esperava @font-face para BT Suave, Sora e Filmotype Yale');

  assert.deepEqual(fontesAusentes(css, path.dirname(CSS_PATH)), []);

  const familias = blocos.map((b) => {
    const m = b.match(/font-family:\s*["']?([^;"']+)/);
    return m ? m[1].trim() : '';
  });
  for (const familia of ['BT Suave', 'Sora', 'Filmotype Yale']) {
    assert.ok(familias.includes(familia), 'falta @font-face da família ' + familia);
  }
  for (const bloco of blocos) {
    assert.match(bloco, /font-display:\s*swap/, '@font-face sem font-display: swap');
  }

  const arquivos = fs.readdirSync(FONTES_DIR).filter((n) => /\.(otf|ttf)$/i.test(n));
  assert.ok(arquivos.length >= 9, 'esperava as 9 fontes oficiais em assets/fontes, achei ' + arquivos.length);
});

test('fontesAusentes detecta @font-face apontando para arquivo inexistente', () => {
  const cssQuebrado = '@font-face { font-family: "X"; src: url("fontes/nao-existe.otf") format("opentype"); }';
  const faltando = fontesAusentes(cssQuebrado, path.dirname(CSS_PATH));
  assert.deepEqual(faltando, ['fontes/nao-existe.otf']);

  const cssRemoto = '@font-face { font-family: "X"; src: url(https://cdn.exemplo/x.woff2); }';
  assert.equal(fontesAusentes(cssRemoto, path.dirname(CSS_PATH)).length, 1);
});

test('nenhuma fonte ou imagem vem de CDN externa', () => {
  assert.ok(!/url\(\s*["']?https?:/i.test(css), 'styles.css carrega recurso remoto');
  assert.ok(!/@import\s/i.test(css), 'styles.css não deve importar folhas externas');
});

test('index.html exibe o logo oficial com alt descritivo e arquivo existente', () => {
  assert.match(
    html,
    /<img[^>]+class="marca-logo"[^>]+src="assets\/marca\/art-visage-horizontal\.png"/,
    'o cabeçalho precisa referenciar assets/marca/art-visage-horizontal.png'
  );
  assert.match(html, /alt="Art Visage by Ilda Guimarães"/, 'o logo precisa de alt descritivo');

  assert.ok(fs.existsSync(LOGO_PATH), 'assets/marca/art-visage-horizontal.png não existe');
  assert.ok(fs.statSync(LOGO_PATH).size > 0, 'o arquivo do logo está vazio');

  const regraLogo = blocoDaRegra(css, '.marca-logo');
  assert.ok(regraLogo, 'regra .marca-logo não encontrada');
  const altura = Number((regraLogo.match(/height:\s*(\d+)px/) || [])[1]);
  assert.ok(altura >= 28 && altura <= 32, 'altura do logo fora de 28-32px: ' + altura);
  assert.match(regraLogo, /padding:\s*[^;]+/, 'o logo precisa de área de proteção (padding)');
  assert.match(regraLogo, /object-fit:\s*contain/);
});

test('botão primário: laranja, hover vinho, raio 12 e alvo de 52px', () => {
  const botao = blocoDaRegra(css, '.btn');
  assert.ok(botao, 'regra .btn não encontrada');
  assert.match(botao, /min-height:\s*52px/);
  assert.match(botao, /border-radius:\s*12px/);

  const primario = blocoDaRegra(css, '.btn-primario');
  assert.ok(primario, 'regra .btn-primario não encontrada');
  assert.match(primario, /background:\s*var\(--laranja\)/);
  assert.match(primario, /color:\s*#fff/);

  const hover = blocoDaRegra(css, '.btn-primario:hover:not(:disabled)');
  assert.ok(hover, 'regra de hover do botão primário não encontrada');
  assert.match(hover, /background:\s*var\(--vinho\)/);
});

test('card selecionado usa roxo + nude e check preenchido (não só cor)', () => {
  const selecionado = blocoDaRegra(css, '.opcao.selecionada');
  assert.ok(selecionado, 'regra .opcao.selecionada não encontrada');
  assert.match(selecionado, /border:\s*2px solid var\(--roxo\)/);
  assert.match(selecionado, /background:\s*var\(--nude\)/);

  const marca = blocoDaRegra(css, '.opcao.selecionada .opcao-marca');
  assert.ok(marca, 'o estado selecionado precisa marcar visualmente o check');
  assert.match(marca, /background:\s*var\(--roxo\)/);
});

test('nota/aviso seguem o padrão nude com borda cinza azulado', () => {
  const nota = blocoDaRegra(css, '.nota');
  assert.ok(nota, 'regra .nota não encontrada');
  assert.match(nota, /border-left:\s*3px solid var\(--ink2\)/);
  assert.match(nota, /background:\s*var\(--nude\)/);
  assert.match(nota, /color:\s*var\(--ink2\)/);
});

test('index.html preserva as tags e os scripts do protótipo', () => {
  const scripts = fs
    .readdirSync(path.join(RAIZ, 'assets'))
    .filter((nome) => nome.endsWith('.js'));
  for (const script of scripts) {
    assert.ok(
      html.includes('src="assets/' + script + '"'),
      'index.html deixou de carregar assets/' + script
    );
  }
  for (const id of ['blocoAtual', 'progresso', 'telaNome', 'telaNum', 'aviso', 'tela', 'rodapeMotivo', 'voltar', 'avancar']) {
    assert.match(html, new RegExp('id="' + id + '"'), 'id usado pelo JS sumiu: ' + id);
  }
});
