/* Testes do Dossiê (tela 17) — teto de clareamento, faixa alcançável e decisão de conflito.
   Node puro, sem framework e sem npm.
   Uso: node testes/dossie.test.js */
'use strict';

var DOSSIE = require('../assets/telas-dossie.js');

var falhas = [];
var testesExecutados = 0;

function falhar(mensagem) {
  falhas.push(mensagem);
}

function conferir(condicao, mensagem) {
  testesExecutados++;
  if (!condicao) falhar(mensagem);
}

function contem(html, trecho, contexto) {
  testesExecutados++;
  if (typeof html !== 'string' || html.indexOf(trecho) === -1) {
    falhar(contexto + ': esperava encontrar ' + JSON.stringify(trecho) + ' no HTML.');
  }
}

function naoContem(html, trecho, contexto) {
  testesExecutados++;
  if (typeof html !== 'string' || html.indexOf(trecho) !== -1) {
    falhar(contexto + ': NÃO deveria encontrar ' + JSON.stringify(trecho) + ' no HTML.');
  }
}

function semErro(descricao, funcao) {
  testesExecutados++;
  try {
    return funcao();
  } catch (err) {
    falhar(descricao + ': lançou erro inesperado — ' + (err && err.message ? err.message : err));
    return null;
  }
}

/* ================================================================
   (a) VC / base 01 / teto 06 -> sem "08 a 10" como alcançável e com 06
   ================================================================ */

var casoA = {
  familia: 'VC',
  baseNatural: 1,
  teto: 6
};

var htmlA = semErro('montarDossie caso (a)', function () {
  return DOSSIE.montarDossie(casoA);
}) || '';

contem(htmlA, 'até 06', '(a) deve indicar teto/faixa até 06');
naoContem(htmlA, '08 a 10', '(a) nunca deve imprimir a faixa 08 a 10 quando o teto for 06');
contem(htmlA, '<dd>até 06</dd>', '(a) a faixa alcançável deve ser limitada a até 06');

/* ================================================================
   (b) Mesmo caso (a) + decisaoConflito -> texto traz a decisão
   ================================================================ */

var casoB1 = {
  familia: 'VC',
  baseNatural: 1,
  teto: 6,
  decisaoConflito: { escolha: 'ponto-mais-alto' }
};

var htmlB1 = semErro('montarDossie caso (b1: ponto-mais-alto)', function () {
  return DOSSIE.montarDossie(casoB1);
}) || '';

contem(htmlB1, 'DECISAO DE CONFLITO: Entregar o ponto mais alto que o fio suporta (mantendo a temperatura da família)',
  '(b1) deve imprimir a linha de decisão de conflito com o texto da escolha');
naoContem(htmlB1, '08 a 10', '(b1) mantém sem 08 a 10');
contem(htmlB1, 'até 06', '(b1) mantém faixa até 06');

var casoB2 = {
  familia: 'VC',
  baseNatural: 1,
  teto: 6,
  decisaoConflito: { escolha: 'adiar' }
};

var htmlB2 = semErro('montarDossie caso (b2: adiar)', function () {
  return DOSSIE.montarDossie(casoB2);
}) || '';

contem(htmlB2, 'DECISAO DE CONFLITO: Adiar a cor e tratar o fio primeiro',
  '(b2) deve imprimir a linha de decisão de conflito com o texto da escolha adiar');

var casoB3 = {
  familia: 'VC',
  baseNatural: 1,
  teto: 6,
  decisaoConflito: {
    escolha: 'adiar',
    rotulo: 'Adiar e recuperar saúde do fio antes da química',
    data: '2026-11-11T12:00:00.000Z'
  }
};

var htmlB3 = semErro('montarDossie caso (b3: rotulo explícito)', function () {
  return DOSSIE.montarDossie(casoB3);
}) || '';

contem(htmlB3, 'DECISAO DE CONFLITO: Adiar e recuperar saúde do fio antes da química',
  '(b3) deve respeitar rotulo customizado de decisaoConflito quando fornecido');

/* ================================================================
   (c) VC / base 08 / teto 10 -> "08 a 10" mantido
   ================================================================ */

var casoC = {
  familia: 'VC',
  baseNatural: 8,
  teto: 10
};

var htmlC = semErro('montarDossie caso (c)', function () {
  return DOSSIE.montarDossie(casoC);
}) || '';

contem(htmlC, '08 a 10', '(c) deve manter 08 a 10 quando o teto for 10 (dentro/acima da faixa)');
contem(htmlC, 'até 10', '(c) teto deve ser até 10');

/* ================================================================
   (d) Sem conflito -> saída sem linha de decisão de conflito
   ================================================================ */

naoContem(htmlA, 'DECISAO DE CONFLITO', '(d) sem decisaoConflito, não deve exibir a linha de conflito');
naoContem(htmlC, 'DECISAO DE CONFLITO', '(d) caso normal sem conflito não exibe linha de conflito');

/* ================================================================
   Casos de borda e robustez
   ================================================================ */

/* Borda 1: Teto derivado automaticamente da base natural (sem teto explícito) */
var casoDerivado = {
  familia: 'VC',
  baseNatural: 1
};
var htmlDerivado = semErro('montarDossie teto derivado de base 1', function () {
  return DOSSIE.montarDossie(casoDerivado);
}) || '';
contem(htmlDerivado, 'até 06', 'teto derivado de base 1 gera até 06');
naoContem(htmlDerivado, '08 a 10', 'teto derivado 06 não permite 08 a 10 como alcançável');

/* Borda 2: Teto igual à altura mínima da faixa (ex.: teto 8 para VC [8, 10]) */
var casoIgualMinimo = {
  familia: 'VC',
  baseNatural: 4,
  teto: 8
};
var htmlIgualMinimo = semErro('montarDossie teto igual à altura mínima', function () {
  return DOSSIE.montarDossie(casoIgualMinimo);
}) || '';
contem(htmlIgualMinimo, '08 a 10', 'teto igual à altura mínima da família preserva a faixa normal');

/* Borda 3: Estado vazio e null */
var htmlNull = semErro('montarDossie(null)', function () {
  return DOSSIE.montarDossie(null);
}) || '';
conferir(typeof htmlNull === 'string' && htmlNull.length > 0, 'estado null deve retornar string');
naoContem(htmlNull, 'DECISAO DE CONFLITO', 'estado null não deve ter conflito');

var htmlVazio = semErro('montarDossie({})', function () {
  return DOSSIE.montarDossie({});
}) || '';
conferir(typeof htmlVazio === 'string' && htmlVazio.length > 0, 'estado vazio deve retornar string');
naoContem(htmlVazio, 'DECISAO DE CONFLITO', 'estado vazio não deve ter conflito');

/* Borda 4: Segurança / Escape XSS em decisaoConflito */
var casoXSS = {
  familia: 'VC',
  baseNatural: 1,
  teto: 6,
  decisaoConflito: {
    escolha: 'custom',
    rotulo: '<script>alert("xss")</script>'
  }
};
var htmlXSS = semErro('montarDossie XSS em decisaoConflito', function () {
  return DOSSIE.montarDossie(casoXSS);
}) || '';
naoContem(htmlXSS, '<script>', 'conteúdo de decisão de conflito precisa escapar HTML');
contem(htmlXSS, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'caracteres especiais devem estar devidamente escapados');

/* ================================================================
   Relatório final
   ================================================================ */

if (falhas.length > 0) {
  console.error('\nDOSSIE TEST: ' + falhas.length + ' FALHA(S) encontrada(s):');
  for (var i = 0; i < falhas.length; i++) {
    console.error('  [' + (i + 1) + '] ' + falhas[i]);
  }
  process.exit(1);
}

console.log('DOSSIE TEST: ok — ' + testesExecutados + ' verificações passaram com sucesso.');
