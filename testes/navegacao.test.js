/* Navegação real do shell com DOM stub: 12 telas na ordem da Ilda + Dossiê 13.
   Uso: node testes/navegacao.test.js
   Sai com código != 0 se a sequência, os bloqueios ou o Dossiê final quebrarem. */
'use strict';

var montarShell = require('./helpers/shell-stub.js').montarShell;

var falhas = [];

function falhar(mensagem) { falhas.push(mensagem); }
function conferir(condicao, mensagem) { if (!condicao) falhar(mensagem); }

var shell = montarShell();
var elementos = shell.elementos;
var VISAGE = shell.VISAGE;
var estado = VISAGE.estado;

function telaAtual() { return elementos.telaNum.textContent; }
function avancar() { elementos.avancar.onclick(); }

function esperarTela(numero, rotulo) {
  var esperado = 'Tela ' + numero + ' de 13';
  conferir(telaAtual() === esperado,
    (rotulo || 'avanço') + ': esperava "' + esperado + '"; veio "' + telaAtual() + '".');
}

conferir(elementos.telaNome.textContent === 'Quem está na cadeira?', 'a primeira tela diverge.');
esperarTela(1, 'abertura');
conferir(elementos.avancar.disabled === true, 'sem cliente, o Continuar deveria começar bloqueado.');

avancar();
esperarTela(1, 'tela 1 bloqueada');

estado.cliente = { nome: 'Ana Teste', contato: '(11) 90000-0000' };
avancar();
esperarTela(2);
conferir(elementos.telaNome.textContent === 'Qual é o desejo dela?', 'a tela 2 diverge.');

estado.desejo = 'clarear sem perder a naturalidade';
avancar();
esperarTela(3);
conferir(elementos.telaNome.textContent === 'Rota escolhida', 'a tela 3 diverge.');

estado.rota = 'harmonia';
avancar();
esperarTela(4);
estado.profundidade = 'clara';
avancar();
esperarTela(5);
estado.baseNatural = 5;
avancar();
esperarTela(6);
conferir(elementos.telaNome.textContent === 'Contraste', 'a tela 6 deveria ser Contraste.');

estado.contraste = 'baixo';
avancar();
esperarTela(7);
conferir(elementos.telaNome.textContent === 'Família', 'a tela 7 deveria ser Família.');

avancar();
esperarTela(8);
conferir(elementos.telaNome.textContent === 'Formato de rosto', 'a tela 8 deveria ser Formato de rosto.');

estado.formatoRosto = shell.DADOS.FORMATOS_ROSTO[0].id;
avancar();
esperarTela(9);
conferir(elementos.telaNome.textContent === 'O que o seu formato direciona', 'a tela 9 diverge.');

avancar();
esperarTela(10);
conferir(elementos.telaNome.textContent === 'Percentual de cabelos brancos', 'a tela 10 diverge.');

estado.brancos = 'poucos';
avancar();
esperarTela(11);
conferir(elementos.telaNome.textContent === 'Como ficou o teste', 'a tela 11 diverge.');

estado.saudeFio = 'comporta';
avancar();
esperarTela(12);
conferir(elementos.telaNome.textContent === 'Cor final', 'a tela 12 deveria ser Cor final.');

avancar();
esperarTela(13);
conferir(elementos.telaNome.textContent === 'Dossiê final', 'a etapa 13 deveria ser o Dossiê final.');
conferir(elementos.avancar.textContent === 'Reiniciar demonstração',
  'no Dossiê o botão deveria reiniciar; veio "' + elementos.avancar.textContent + '".');

avancar();
esperarTela(1, 'reinício no Dossiê');
conferir(VISAGE.estado.cliente === null, 'o reinício deveria apagar o prontuário.');

/* ---------- fio sem condição bloqueia na tela 11 ---------- */

estado = VISAGE.estado;
estado.cliente = { nome: 'Bia Teste', contato: '(11) 91111-1111' };
estado.rota = 'harmonia';
estado.profundidade = 'media';
estado.baseNatural = 4;
estado.contraste = 'medio';
estado.formatoRosto = shell.DADOS.FORMATOS_ROSTO[0].id;
estado.brancos = 'metade';
for (var i = 0; i < 10; i += 1) avancar();
esperarTela(11, 'caminho até a tela 11');
estado.saudeFio = 'sem';
avancar();
esperarTela(11, 'fio sem condição');
conferir(elementos.rodapeMotivo.textContent.indexOf('RN-22') !== -1,
  'o bloqueio deveria citar a RN-22; veio "' + elementos.rodapeMotivo.textContent + '".');

if (falhas.length) {
  console.error('NAVEGACAO: ' + falhas.length + ' falha(s)');
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
} else {
  console.log('NAVEGACAO: ok — 12 telas na ordem, bloqueios e Dossiê final 13.');
}
