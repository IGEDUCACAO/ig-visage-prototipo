/* Sessão salva ilegível: o shell precisa avisar e abrir um prontuário novo.
   Uso: node testes/sessao-corrompida.test.js
   Sai com código != 0 se a falha for engolida em silêncio. */
'use strict';

var montarShell = require('./helpers/shell-stub.js').montarShell;

var falhas = [];
function falhar(mensagem) { falhas.push(mensagem); }
function conferir(condicao, mensagem) { if (!condicao) falhar(mensagem); }

var shell = montarShell({ sessao: '{isto não é json' });
var elementos = shell.elementos;

conferir(elementos.telaNum.textContent === 'Tela 1 de 13',
  'sessão corrompida deveria abrir na tela 1; veio "' + elementos.telaNum.textContent + '".');
conferir(elementos.aviso.hidden === false && elementos.aviso.textContent.indexOf('corrompida') !== -1,
  'sessão corrompida precisa avisar o usuário em vez de sumir em silêncio.');
conferir(shell.VISAGE.estado && shell.VISAGE.estado.cliente === null,
  'com a sessão corrompida o prontuário deveria começar vazio.');

if (falhas.length) {
  console.error('SESSAO CORROMPIDA: ' + falhas.length + ' falha(s)');
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
} else {
  console.log('SESSAO CORROMPIDA: ok — aviso explícito e prontuário novo.');
}
