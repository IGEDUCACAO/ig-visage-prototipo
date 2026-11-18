/* Teste do fluxo da Ilda — node puro, sem framework e sem npm.
   Uso: node testes/fluxo.test.js
   Sai com código != 0 se a ordem, os títulos ou a ligação das 12 telas quebrarem. */
'use strict';

var DADOS = require('../assets/data.js');
var MOTOR = require('../assets/engine.js');

global.window = { VISAGE_DATA: DADOS, VISAGE_ENGINE: MOTOR };
global.document = {
  getElementById: function () { return null; }
};

/* app.js sai cedo sem o HTML montado, mas publica VISAGE.TELAS antes da checagem.
   O erro esperado ("Shell incompleto") não interessa a este teste. */
var erroOriginal = console.error;
console.error = function () {};
require('../assets/app.js');
console.error = erroOriginal;

require('../assets/telas-leitura.js');
require('../assets/telas-prescricao.js');
require('../assets/telas-fechamento.js');

var VISAGE = global.window.VISAGE;

var falhas = [];

function falhar(mensagem) {
  falhas.push(mensagem);
}

function conferir(condicao, mensagem) {
  if (!condicao) falhar(mensagem);
}

/* Ordem e títulos exatamente como a Ilda ditou. */
var ESPERADO = [
  'Quem está na cadeira?',
  'Qual o desejo dela?',
  'Rota escolhida',
  'Profundidade da pele',
  'Base natural do cabelo',
  'Contraste',
  'Família',
  'Formato do rosto',
  'O que o seu formato direciona',
  'Percentual de cabelos brancos',
  'Como ficou o teste',
  'Cor final'
];

var BLOCOS = ['abertura', 'leitura', 'rosto', 'prescricao', 'fechamento'];

/* ---------- o fluxo é publicado ---------- */

conferir(!!VISAGE && Array.isArray(VISAGE.TELAS), 'VISAGE.TELAS precisa ser um array publicado pelo app.js.');

var TELAS = (VISAGE && Array.isArray(VISAGE.TELAS)) ? VISAGE.TELAS : [];

/* ---------- 12 telas, nem uma a mais (o dossiê não conta) ---------- */

conferir(TELAS.length === 12, 'O fluxo precisa de 12 telas; veio ' + TELAS.length + '.');

conferir(TELAS.every(function (tela) { return tela.titulo !== 'Dossiê final'; }),
  'O dossiê final é a etapa 13, fora da contagem das 12 telas.');

/* ---------- títulos exatos, na ordem ---------- */

ESPERADO.forEach(function (titulo, posicao) {
  var tela = TELAS[posicao];
  conferir(!!tela, 'Falta a tela ' + (posicao + 1) + ' ("' + titulo + '").');
  if (tela) {
    conferir(tela.titulo === titulo,
      'Tela ' + (posicao + 1) + ' deveria se chamar "' + titulo + '"; veio "' + tela.titulo + '".');
  }
});

/* ---------- cada posição aponta para uma tela registrada ---------- */

var ids = {};
TELAS.forEach(function (tela, posicao) {
  var etiqueta = 'Tela ' + (posicao + 1);

  conferir(Number.isInteger(tela.tela), etiqueta + ' sem id de registro inteiro.');
  conferir(!ids[tela.tela], etiqueta + ' reaproveita o id de registro ' + tela.tela + '.');
  ids[tela.tela] = true;

  conferir(BLOCOS.indexOf(tela.bloco) !== -1, etiqueta + ' em bloco desconhecido: ' + tela.bloco + '.');

  var registro = VISAGE.telas && VISAGE.telas[tela.tela];
  conferir(!!registro, etiqueta + ' aponta para a tela ' + tela.tela + ', que não foi registrada.');
  if (registro) {
    conferir(typeof registro.render === 'function',
      etiqueta + ' (registro ' + tela.tela + ') não expõe render(el, ctx).');
  }
});

/* ---------- telas que saíram do fluxo continuam no código ---------- */

[12, 13, 15, 16, 17].forEach(function (idForaDoFluxo) {
  conferir(!ids[idForaDoFluxo],
    'A tela de registro ' + idForaDoFluxo + ' saiu do fluxo linear e não pode voltar a ele.');
  var fora = VISAGE.telas && VISAGE.telas[idForaDoFluxo];
  conferir(!!fora && typeof fora.render === 'function',
    'A tela de registro ' + idForaDoFluxo + ' saiu do fluxo, mas precisa continuar registrada no código.');
});

/* ---------- o h2 de cada tela é o título oficial do fluxo ---------- */

function elementoFalso() {
  return {
    innerHTML: '',
    querySelectorAll: function () { return []; },
    querySelector: function () { return null; }
  };
}

function contextoFalso() {
  return {
    estado: {},
    salvar: function () {},
    recarregar: function () {},
    atualizar: function () {},
    irPara: function () { return true; }
  };
}

TELAS.forEach(function (tela, posicao) {
  var registro = VISAGE.telas && VISAGE.telas[tela.tela];
  if (!registro || typeof registro.render !== 'function') return;

  var el = elementoFalso();
  try {
    registro.render(el, contextoFalso());
  } catch (err) {
    falhar('Tela ' + (posicao + 1) + ' quebrou ao renderizar com o estado vazio: ' + err.message);
    return;
  }

  var achado = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(el.innerHTML);
  conferir(!!achado, 'Tela ' + (posicao + 1) + ' não tem <h2>.');
  if (achado) {
    conferir(achado[1] === tela.titulo,
      'Tela ' + (posicao + 1) + ': h2 "' + achado[1] + '" diverge do título do fluxo "' + tela.titulo + '".');
  }
});

/* ---------- resultado ---------- */

if (falhas.length) {
  console.error('FLUXO: ' + falhas.length + ' falha(s)');
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
} else {
  console.log('FLUXO: ok — 12 telas na ordem da Ilda, títulos exatos, ids únicos e todos registrados (dossiê fora da contagem).');
}
