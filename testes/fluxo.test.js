/* Teste do fluxo de 12 telas na ordem da Ilda (18/11/2026).
   Node puro, sem framework e sem npm.
   Uso: node testes/fluxo.test.js
   Sai com código != 0 se:
   - o array TELAS não tiver exatamente as 12 telas na ordem e com os títulos pedidos;
   - alguma das 12 telas não estiver registrada com o mesmo título;
   - o Dossiê não for a etapa final 13;
   - os textos ajustados pela cliente sumirem ou voltarem ao texto antigo. */
'use strict';

var falhas = [];

function falhar(mensagem) {
  falhas.push(mensagem);
}

function conferir(condicao, mensagem) {
  if (!condicao) falhar(mensagem);
}

/* ---------- 1. Metadados do fluxo (app.js sem DOM) ---------- */

var app = require('../assets/app.js');
var VISAGE_META = app.VISAGE || {};
var TELAS = VISAGE_META.TELAS || [];
var DOSSIE_META = VISAGE_META.TELA_DOSSIE || null;

var TITULOS = [
  'Quem está na cadeira?',
  'Qual é o desejo dela?',
  'Rota escolhida',
  'Profundidade da pele',
  'Base natural',
  'Contraste',
  'Família',
  'Formato de rosto',
  'O que o seu formato direciona',
  'Percentual de cabelos brancos',
  'Como ficou o teste',
  'Cor final'
];

conferir(TELAS.length === 12, 'TELAS deveria ter 12 itens; veio ' + TELAS.length + '.');
TITULOS.forEach(function (titulo, indice) {
  var tela = TELAS[indice];
  conferir(!!tela, 'falta a tela ' + (indice + 1) + ' no array TELAS.');
  if (!tela) return;
  conferir(tela.n === indice + 1, 'a posição ' + (indice + 1) + ' deveria ter n=' + (indice + 1) + '; veio ' + tela.n + '.');
  conferir(tela.titulo === titulo,
    'tela ' + (indice + 1) + ' deveria se chamar "' + titulo + '"; veio "' + tela.titulo + '".');
});

conferir(!!DOSSIE_META, 'o Dossiê precisa de metadados próprios, fora do array TELAS.');
conferir(DOSSIE_META && DOSSIE_META.n === 13, 'o Dossiê deveria ser a etapa 13; veio ' + (DOSSIE_META && DOSSIE_META.n) + '.');
conferir(DOSSIE_META && DOSSIE_META.titulo === 'Dossiê final', 'título do Dossiê diverge do esperado.');

/* ---------- 2. Registro das telas nos arquivos ---------- */

var DADOS = require('../assets/data.js');
var MOTOR = require('../assets/engine.js');

var registros = {};
var stub = {
  telas: registros,
  registrarTela: function (n, definicao) { registros[n] = definicao; }
};

var windowStub = { VISAGE_DATA: DADOS, VISAGE_ENGINE: MOTOR, VISAGE: stub };
global.window = windowStub;
global.document = {
  addEventListener: function () {},
  removeEventListener: function () {},
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  getElementById: function () { return null; }
};

require('../assets/telas-leitura.js');
require('../assets/telas-prescricao.js');
require('../assets/telas-fechamento.js');
require('../assets/telas-dossie.js').registrar(stub);

TITULOS.forEach(function (titulo, indice) {
  var numero = indice + 1;
  var registro = registros[numero];
  conferir(!!registro, 'a tela ' + numero + ' não foi registrada.');
  if (!registro) return;
  conferir(registro.titulo === titulo,
    'registro da tela ' + numero + ' deveria ter o título "' + titulo + '"; veio "' + registro.titulo + '".');
  conferir(typeof registro.render === 'function', 'a tela ' + numero + ' precisa de render(el, ctx).');
});

conferir(!!registros[13], 'o Dossiê (tela 13) não foi registrado.');
conferir(registros[13] && registros[13].titulo === 'Dossiê final', 'registro do Dossiê com título errado.');

/* As telas que saíram do fluxo continuam no código, fora do array TELAS. */
[101, 102, 103, 104, 105].forEach(function (numero) {
  conferir(!!registros[numero], 'a tela arquivada ' + numero + ' sumiu do código.');
  conferir(registros[numero] && typeof registros[numero].render === 'function',
    'a tela arquivada ' + numero + ' perdeu o render.');
});

var TITULOS_ARQUIVADOS = {
  101: 'Regra dos 4 tons',
  102: 'Conflito e decisão',
  103: 'Diagnóstico',
  104: 'Manutenção e retorno',
  105: 'Paleta de vestuário'
};
Object.keys(TITULOS_ARQUIVADOS).forEach(function (numero) {
  conferir(registros[numero] && registros[numero].titulo === TITULOS_ARQUIVADOS[numero],
    'a tela arquivada ' + numero + ' deveria manter o título "' + TITULOS_ARQUIVADOS[numero] +
    '"; veio "' + (registros[numero] && registros[numero].titulo) + '".');
});

/* ---------- 3. Textos ajustados pela cliente ---------- */

function elementoFalso() {
  return {
    innerHTML: '',
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    focus: function () {}
  };
}

function contextoFalso(estado) {
  return {
    estado: estado,
    salvar: function () {},
    recarregar: function () {},
    atualizar: function () {},
    irPara: function () { return true; }
  };
}

function renderizar(numero, estado) {
  var el = elementoFalso();
  registros[numero].render(el, contextoFalso(estado || {}));
  return el.innerHTML;
}

var tela3 = renderizar(3, {});
conferir(tela3.indexOf('RN-24') === -1, 'a tela 3 não pode citar RN-24.');
conferir(tela3.indexOf('Nomenclatura') === -1, 'a tela 3 não pode manter a nota de nomenclatura.');

var tela4 = renderizar(4, {});
conferir(tela4.indexOf('Profundidade de pele é uma medida: o quão clara ou escura é a pele.') !== -1,
  'a tela 4 não tem a frase lead pedida pela cliente.');
conferir(tela4.indexOf('O que esta tela não faz') === -1, 'a tela 4 ainda mostra a nota removida.');

var tela10 = renderizar(10, {});
conferir(tela10.indexOf('<h2>Percentual de cabelos brancos</h2>') !== -1,
  'a tela 10 precisa do h2 "Percentual de cabelos brancos".');

var tela11 = renderizar(11, {});
conferir(tela11.indexOf('<h2>Como ficou o teste</h2>') !== -1,
  'a tela 11 precisa do h2 "Como ficou o teste".');

var tela12 = renderizar(12, {});
conferir(tela12.indexOf('Sugestões de cores para a sua família') !== -1,
  'a tela 12 precisa do rótulo de sugestões antes do bloco.');
conferir(tela12.indexOf('Cor escolhida pela cliente') !== -1,
  'a tela 12 precisa do rótulo da cor escolhida.');
conferir(tela12.indexOf('Sugestões de cores para a sua família') < tela12.indexOf('Cor escolhida pela cliente'),
  'os rótulos da tela 12 estão na ordem errada.');

console.log('FLUXO 12 TELAS: ' + (falhas.length ? falhas.length + ' falha(s)' : 'ok'));

if (falhas.length) {
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
}
