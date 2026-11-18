/* Migração da sessão salva antes da reordenação (chave visage.v2).
   Uso: node testes/migracao.test.js
   Sai com código != 0 se a posição antiga não for levada à tela equivalente
   ou se o prontuário já salvo se perder. */
'use strict';

var montarShell = require('./helpers/shell-stub.js').montarShell;

var falhas = [];
function falhar(mensagem) { falhas.push(mensagem); }
function conferir(condicao, mensagem) { if (!condicao) falhar(mensagem); }

/* Tela 14 antiga era "Cor final"; na ordem nova a equivalente é a 12. */
var shell = montarShell({
  sessao: {
    v: 2,
    estado: {
      cliente: { nome: 'Cliente Antiga', contato: '(11) 92222-2222' },
      rota: 'harmonia',
      baseNatural: 6
    },
    telaAtual: 14,
    trilha: [1, 14]
  }
});

var elementos = shell.elementos;
var estado = shell.VISAGE.estado;

conferir(elementos.telaNum.textContent === 'Tela 12 de 13',
  'a tela 14 antiga deveria virar 12; veio "' + elementos.telaNum.textContent + '".');
conferir(elementos.telaNome.textContent === 'Cor final',
  'a tela migrada deveria ser Cor final; veio "' + elementos.telaNome.textContent + '".');
conferir(estado && estado.cliente && estado.cliente.nome === 'Cliente Antiga',
  'o prontuário salvo não pode se perder na migração.');
conferir(estado && estado.rota === 'harmonia', 'a rota salva não pode se perder na migração.');
conferir(estado && estado.baseNatural === 6, 'a base natural salva não pode se perder na migração.');
conferir(elementos.aviso.hidden === false && elementos.aviso.textContent.indexOf('reorganizado') !== -1,
  'a migração deveria avisar que o fluxo foi reorganizado.');

if (falhas.length) {
  console.error('MIGRACAO: ' + falhas.length + ' falha(s)');
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
} else {
  console.log('MIGRACAO: ok — sessão antiga retomada na tela equivalente sem perder dado.');
}
