/* Teste do bloco Prescrição (telas 10 a 13) — node puro, sem framework e sem npm.
   Uso: node testes/prescricao.test.js
   Sai com código != 0 se o motor da prescrição, o index.html ou os casos da
   spec divergirem. */
'use strict';

var fs = require('fs');
var path = require('path');
var DADOS = require('../assets/data.js');
var MOTOR = require('../assets/engine.js');

var falhas = [];

function falhar(mensagem) {
  falhas.push(mensagem);
}

function conferir(condicao, mensagem) {
  if (!condicao) falhar(mensagem);
}

function esperaErro(descricao, funcao, trechoDaMensagem) {
  try {
    funcao();
    falhar(descricao + ': deveria lançar erro e não lançou.');
  } catch (err) {
    if (!(err instanceof Error)) {
      falhar(descricao + ': lançou algo que não é Error.');
    } else if (trechoDaMensagem && err.message.indexOf(trechoDaMensagem) === -1) {
      falhar(descricao + ': mensagem sem "' + trechoDaMensagem + '" — veio: ' + err.message);
    }
  }
}

function siglaDe(familia) {
  return familia && familia.sigla ? familia.sigla : null;
}

/* ---------- index.html: os dois links de folha de estilo ---------- */

var html = '';
try {
  html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
} catch (err) {
  falhar('não foi possível ler index.html: ' + err.message);
}

conferir(/<link[^>]+href=["']assets\/prescricao\.css["']/.test(html),
  'index.html não referencia assets/prescricao.css.');
conferir(/<link[^>]+href=["']assets\/fechamento\.css["']/.test(html),
  'index.html não referencia assets/fechamento.css (o link existe mesmo sem o arquivo).');

/* ---------- familiaPrescrita ---------- */

conferir(siglaDe(MOTOR.familiaPrescrita('profunda', 'fria')) === 'IP',
  'familiaPrescrita("profunda", "fria") deveria ser IP; veio ' + siglaDe(MOTOR.familiaPrescrita('profunda', 'fria')) + '.');
conferir(siglaDe(MOTOR.familiaPrescrita('media', 'fria')) === 'VE',
  'familiaPrescrita("media", "fria") deveria ser VE; veio ' + siglaDe(MOTOR.familiaPrescrita('media', 'fria')) + '.');
conferir(siglaDe(MOTOR.familiaPrescrita('clara', 'quente')) === 'PC',
  'familiaPrescrita("clara", "quente") deveria ser PC; veio ' + siglaDe(MOTOR.familiaPrescrita('clara', 'quente')) + '.');

conferir(siglaDe(MOTOR.familiaPrescrita('média', 'Fria')) === 'VE',
  'familiaPrescrita deveria aceitar acento e caixa ("média", "Fria").');

conferir(MOTOR.familiaPrescrita('profunda', 'verde') === null,
  'temperatura desconhecida deveria devolver null.');
conferir(MOTOR.familiaPrescrita('profunda', '') === null,
  'temperatura vazia deveria devolver null.');
conferir(MOTOR.familiaPrescrita(null, 'fria') === null,
  'profundidade ausente deveria devolver null.');

/* Neutra cai no lado frio do par — escolha documentada no motor. */
var neutra = MOTOR.familiaPrescrita('profunda', 'neutra');
conferir(siglaDe(neutra) === 'IP',
  'familiaPrescrita("profunda", "neutra") deveria cair na família fria do par (IP); veio ' + siglaDe(neutra) + '.');
conferir(neutra && neutra.temperatura === 'fria',
  'a família escolhida para leitura neutra deveria ser fria.');

/* ---------- calibracaoDeContraste ---------- */

conferir(MOTOR.calibracaoDeContraste('baixo') === 'Suave',
  'calibracaoDeContraste("baixo") deveria ser Suave; veio ' + MOTOR.calibracaoDeContraste('baixo') + '.');
conferir(MOTOR.calibracaoDeContraste('medio') === 'Suave',
  'calibracaoDeContraste("medio") deveria ser Suave.');
conferir(MOTOR.calibracaoDeContraste('alto') === 'Intensa',
  'calibracaoDeContraste("alto") deveria ser Intensa; veio ' + MOTOR.calibracaoDeContraste('alto') + '.');

esperaErro('calibracaoDeContraste("suave")', function () { MOTOR.calibracaoDeContraste('suave'); }, 'contraste');
esperaErro('calibracaoDeContraste(null)', function () { MOTOR.calibracaoDeContraste(null); }, 'contraste');

/* ---------- amostrasViaveis: forma de 3 argumentos ---------- */

var VC = DADOS.familiaPorSigla('VC');
var IP = DADOS.familiaPorSigla('IP');

conferir(VC && VC.faixa[0] === 8 && VC.faixa[1] === 10, 'a família VC deveria ter faixa 08–10.');

/* base 01 + 4 degraus → teto 06: nada da faixa 08–10 ao alcance. */
var semAlcance = MOTOR.amostrasViaveis(VC, 1, 4);
conferir(Array.isArray(semAlcance) && semAlcance.length === 0,
  'amostrasViaveis(VC, 1, 4) deveria ser vazio (teto 06 abaixo da faixa 08–10); veio ' + JSON.stringify(semAlcance) + '.');

/* base 03 + 4 degraus → teto 07 (a régua de mercado não tem a altura 02):
   continua abaixo da faixa 08–10, então também vazio. */
var semAlcance3 = MOTOR.amostrasViaveis(VC, 3, 4);
conferir(Array.isArray(semAlcance3) && semAlcance3.length === 0,
  'amostrasViaveis(VC, 3, 4) deveria ser vazio (teto 07 abaixo da faixa 08–10); veio ' + JSON.stringify(semAlcance3) + '.');

/* base 08 + 4 degraus → teto 10: a família inteira fica ao alcance. */
var comAlcance = MOTOR.amostrasViaveis(VC, 8, 4);
conferir(comAlcance.length === VC.amostras.length,
  'amostrasViaveis(VC, 8, 4) deveria devolver as ' + VC.amostras.length + ' amostras da família; veio ' + comAlcance.length + '.');

/* nenhuma amostra devolvida pode ficar fora da faixa da família. */
var IPforaDaFaixa = MOTOR.amostrasViaveis({
  sigla: 'X',
  faixa: [6, 7],
  amostras: [
    { codigo: '6.1', nome: 'Dentro da faixa', altura: 6, hex: '#000000' },
    { codigo: '8.1', nome: 'Fora da faixa', altura: 8, hex: '#111111' }
  ]
}, 6, 4);
conferir(IPforaDaFaixa.length === 1 && IPforaDaFaixa[0].altura === 6,
  'amostrasViaveis de 3 argumentos deveria descartar a altura 08 fora da faixa 06–07; veio ' + JSON.stringify(IPforaDaFaixa) + '.');

conferir(MOTOR.amostrasViaveis('ZZ', 8, 4).length === 0,
  'família desconhecida deveria devolver lista vazia.');
conferir(MOTOR.amostrasViaveis(VC, null, 4).length === 0,
  'base natural ausente deveria devolver lista vazia.');

/* ---------- amostrasViaveis: forma de 2 argumentos (compatibilidade) ---------- */

conferir(MOTOR.amostrasViaveis(VC, 7).length === 0,
  'amostrasViaveis(VC, 7) — forma antiga — deveria ser vazio.');
conferir(MOTOR.amostrasViaveis(VC, 8).length === 1,
  'amostrasViaveis(VC, 8) — forma antiga — deveria devolver a amostra 8.1.');
conferir(MOTOR.amostrasViaveis('VC', 10).length === 3,
  'amostrasViaveis deveria aceitar a sigla e devolver as três amostras até 10.');

/* O roteamento da tela 11 continua coerente nas duas formas. */
conferir(MOTOR.rotaDaTela11(VC, 7) === 12,
  'rotaDaTela11(VC, 7) deveria ir para a tela 12 (conflito).');
conferir(MOTOR.rotaDaTela11(VC, 10) === 13,
  'rotaDaTela11(VC, 10) deveria ir para a tela 13 (escolha da amostra).');

/* ---------- faixaAlcancavel ---------- */

var textoConflito = MOTOR.faixaAlcancavel(VC, 3, 4);
conferir(typeof textoConflito === 'string' && textoConflito.length > 0,
  'faixaAlcancavel(VC, 3, 4) deveria devolver texto.');
conferir(textoConflito.indexOf('nenhuma altura') !== -1 && textoConflito.indexOf('08–10') !== -1,
  'faixaAlcancavel(VC, 3, 4) deveria declarar que nenhuma altura da família 08–10 está ao alcance; veio "' + textoConflito + '".');

var textoAlcance = MOTOR.faixaAlcancavel(VC, 8, 4);
conferir(textoAlcance === 'até a altura 10',
  'faixaAlcancavel(VC, 8, 4) deveria ser "até a altura 10"; veio "' + textoAlcance + '".');

var textoIP = MOTOR.faixaAlcancavel(IP, 1, 4);
conferir(textoIP === 'até a altura 04',
  'faixaAlcancavel(IP, 1, 4) deveria ser "até a altura 04"; veio "' + textoIP + '".');

conferir(MOTOR.faixaAlcancavel(VC, null, 4).indexOf('indisponível') !== -1,
  'faixaAlcancavel sem base natural deveria dizer que o teto está indisponível.');

/* ---------- validaEtapa das telas 10 a 13 ---------- */

var baseOk = {
  profundidade: 'clara',
  temperatura: 'fria',
  baseNatural: 8,
  familia: 'VC',
  contraste: 'baixo',
  rota: 'harmonia'
};

conferir(MOTOR.validaEtapa({ profundidade: 'clara' }, 10).ok === false,
  'tela 10 deveria bloquear sem temperatura.');
conferir(MOTOR.validaEtapa({ profundidade: 'clara', temperatura: 'fria' }, 10).ok === true,
  'tela 10 deveria liberar com profundidade e temperatura.');
conferir(MOTOR.validaEtapa(baseOk, 11).ok === true,
  'tela 11 deveria liberar com família e base natural.');
conferir(MOTOR.validaEtapa({ profundidade: 'clara', temperatura: 'fria' }, 12).ok === false,
  'tela 12 deveria bloquear sem decisão.');
conferir(MOTOR.validaEtapa({
  profundidade: 'clara', temperatura: 'fria', baseNatural: 8, familia: 'VC',
  decisaoConflito: { escolha: 'adiar-cor' }
}, 12).ok === true, 'tela 12 deveria liberar com decisão registrada.');
conferir(MOTOR.validaEtapa(baseOk, 13).ok === false,
  'tela 13 deveria bloquear sem amostra escolhida.');
conferir(MOTOR.validaEtapa({
  profundidade: 'clara', temperatura: 'fria', baseNatural: 8, familia: 'VC',
  amostraEscolhida: { codigo: '8.1', nome: 'Loiro Cinza', altura: 8, hex: '#cfb99c', manual: false }
}, 13).ok === true, 'tela 13 deveria liberar com amostra viável escolhida.');
conferir(MOTOR.validaEtapa({
  profundidade: 'clara', temperatura: 'fria', baseNatural: 8, familia: 'VC',
  amostraEscolhida: { codigo: '10.3', nome: 'Platinado Dourado', altura: 10, hex: '#eee0bb', manual: false }
}, 13).ok === false, 'tela 13 deveria recusar amostra de outra família (10.3 é da PC).');

/* Família cuja faixa está fora do teto (base 01): o caso é da tela 12, não da 13. */
conferir(MOTOR.validaEtapa({
  profundidade: 'clara', temperatura: 'fria', baseNatural: 1, familia: 'VC',
  amostraEscolhida: { codigo: '8.1', nome: 'Loiro Cinza', altura: 8, hex: '#cfb99c', manual: false }
}, 13).ok === false, 'tela 13 deveria recusar quando nenhuma amostra cabe no teto.');

/* Família desconhecida não permite escolher amostra. */
conferir(MOTOR.validaEtapa({
  profundidade: 'clara', temperatura: 'fria', baseNatural: 8, familia: 'ZZ'
}, 13).ok === false, 'tela 13 deveria recusar família desconhecida.');

/* ---------- resultado ---------- */

if (falhas.length) {
  console.error('PRESCRIÇÃO: ' + falhas.length + ' falha(s)');
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
} else {
  console.log('PRESCRIÇÃO: ok — família por profundidade × temperatura, calibração, teto/faixa e viabilidade de amostra conferidos.');
}
