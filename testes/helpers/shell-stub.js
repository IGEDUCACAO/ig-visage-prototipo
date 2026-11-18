/* Stub mínimo de DOM/localStorage para exercitar assets/app.js em Node.
   Não substitui navegador: cobre o shell, a navegação e a persistência. */
'use strict';

function criarElemento(id) {
  var el = {
    id: id,
    textContent: '',
    innerHTML: '',
    hidden: false,
    disabled: false,
    title: '',
    className: '',
    children: [],
    onclick: null,
    setAttribute: function (nome, valor) { el[nome] = valor; },
    getAttribute: function (nome) {
      return Object.prototype.hasOwnProperty.call(el, nome) ? el[nome] : null;
    },
    appendChild: function (filho) { el.children.push(filho); return filho; },
    addEventListener: function (tipo, fn) { if (tipo === 'click') el.onclick = fn; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    focus: function () {},
    classList: { toggle: function () {}, add: function () {}, remove: function () {} }
  };
  return el;
}

function montarShell(opcoes) {
  var config = opcoes || {};
  var armazenamento = {};
  if (config.sessao !== undefined) {
    armazenamento['visage.v2'] = typeof config.sessao === 'string'
      ? config.sessao
      : JSON.stringify(config.sessao);
  }

  var elementos = {};
  ['blocoAtual', 'progresso', 'telaNome', 'telaNum', 'tela', 'aviso', 'rodapeMotivo', 'voltar', 'avancar']
    .forEach(function (id) { elementos[id] = criarElemento(id); });

  var documentStub = {
    title: '',
    getElementById: function (id) { return elementos[id] || null; },
    createElement: function () { return criarElemento('criado'); },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {}
  };

  var windowStub = {
    VISAGE: {},
    localStorage: {
      getItem: function (chave) {
        return Object.prototype.hasOwnProperty.call(armazenamento, chave) ? armazenamento[chave] : null;
      },
      setItem: function (chave, valor) { armazenamento[chave] = String(valor); },
      removeItem: function (chave) { delete armazenamento[chave]; }
    }
  };

  windowStub.VISAGE_DATA = require('../../assets/data.js');
  windowStub.VISAGE_ENGINE = require('../../assets/engine.js');
  windowStub.VISAGE.ilustracoesCorte = require('../../assets/ilustracoes-corte.js');

  global.window = windowStub;
  global.document = documentStub;

  require('../../assets/telas-leitura.js');
  require('../../assets/telas-prescricao.js');
  require('../../assets/telas-fechamento.js');
  var dossie = require('../../assets/telas-dossie.js');

  require('../../assets/app.js');
  dossie.registrar(windowStub.VISAGE);

  return {
    elementos: elementos,
    document: documentStub,
    window: windowStub,
    VISAGE: windowStub.VISAGE,
    DADOS: windowStub.VISAGE_DATA,
    sessao: armazenamento
  };
}

module.exports = { montarShell: montarShell };
