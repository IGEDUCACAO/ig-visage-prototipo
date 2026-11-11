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

/* ---------- smoke das telas 10 a 13 (DOM falso, sem navegador) ---------- */

function elementoFalso() {
  return {
    innerHTML: '',
    value: '',
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; }
  };
}

function contextoFalso(estado) {
  return {
    estado: estado,
    salvar: function () {},
    recarregar: function () {},
    irPara: function () { return true; },
    atualizar: function () {},
    dados: DADOS,
    motor: MOTOR
  };
}

var TELAS = null;
try {
  global.window = { VISAGE_DATA: DADOS, VISAGE_ENGINE: MOTOR };
  require('../assets/telas-prescricao.js');
  TELAS = global.window.VISAGE && global.window.VISAGE.telas;
} catch (err) {
  falhar('não foi possível carregar assets/telas-prescricao.js: ' + err.message);
}

if (!TELAS) {
  falhar('as telas de prescrição não se registraram em window.VISAGE.telas.');
} else {
  [10, 11, 12, 13].forEach(function (n) {
    conferir(TELAS[n] && typeof TELAS[n].render === 'function', 'a tela ' + n + ' não foi registrada.');
    conferir(TELAS[n] && TELAS[n].bloco === 'prescricao', 'a tela ' + n + ' deveria estar no bloco prescricao.');
  });

  function html10(estado) {
    var el = elementoFalso();
    TELAS[10].render(el, contextoFalso(estado));
    return el.innerHTML;
  }

  /* sem temperatura: só a leitura é pedida, painel ainda não aparece. */
  var semTemperatura = html10({ profundidade: 'clara', rota: 'harmonia', contraste: 'baixo', baseNatural: 8 });
  conferir(semTemperatura.indexOf('Profundidade: <b>Clara</b>') !== -1,
    'tela 10 deveria exibir "Profundidade: Clara".');
  conferir(semTemperatura.indexOf('Temperatura (leitura do Kit de Tecidos)') !== -1,
    'tela 10 deveria pedir a temperatura do Kit de Tecidos.');
  conferir(semTemperatura.indexOf('A temperatura vem do Kit de Tecidos; o app não a estima.') !== -1,
    'tela 10 deveria trazer a nota de que a temperatura vem do Kit de Tecidos.');
  conferir(semTemperatura.indexOf('Família prescrita') === -1,
    'tela 10 não deveria mostrar família antes de haver temperatura.');

  /* com temperatura: família, calibração e contraste confirmado. */
  var comFria = html10({ profundidade: 'clara', temperatura: 'fria', rota: 'harmonia', contraste: 'medio', baseNatural: 8 });
  conferir(comFria.indexOf('VC') !== -1 && comFria.indexOf('Verão Claro') !== -1,
    'tela 10 deveria mostrar Verão Claro · VC com temperatura fria.');
  conferir(comFria.indexOf('Suave') !== -1, 'contraste médio deveria calibrar em Suave.');
  conferir(comFria.indexOf('clara · fria') !== -1, 'tela 10 deveria mostrar "clara · fria".');
  conferir(comFria.indexOf('Família prescrita') !== -1, 'rota Harmonia usa o rótulo "Família prescrita".');

  var comEstilo = html10({ profundidade: 'clara', temperatura: 'quente', rota: 'estilo', contraste: 'alto', baseNatural: 8 });
  conferir(comEstilo.indexOf('Família proposta') !== -1,
    'rota Estilo deveria usar o rótulo "Família proposta".');
  conferir(comEstilo.indexOf('Intensa') !== -1, 'contraste alto deveria calibrar em Intensa.');

  /* a família persistida recupera a temperatura ao recarregar. */
  var recuperado = { profundidade: 'clara', familia: 'VC', rota: 'harmonia', contraste: 'baixo', baseNatural: 8 };
  html10(recuperado);
  conferir(recuperado.temperatura === 'fria',
    'tela 10 deveria recuperar a temperatura da família persistida; veio ' + String(recuperado.temperatura) + '.');

  /* profundidade alterada invalida a família e as decisões da família anterior. */
  var desatualizado = {
    profundidade: 'profunda',
    temperatura: 'fria',
    familia: 'VC',
    rota: 'harmonia',
    contraste: 'medio',
    baseNatural: 1,
    teto: 6,
    decisaoConflito: { escolha: 'adiar-cor', data: new Date().toISOString() },
    amostraEscolhida: { codigo: '8.1', manual: false }
  };
  html10(desatualizado);
  conferir(desatualizado.familia === 'IP',
    'tela 10 deveria sincronizar a família com a profundidade atual; veio ' + String(desatualizado.familia) + '.');
  conferir(desatualizado.decisaoConflito === null && desatualizado.amostraEscolhida === null && desatualizado.teto === null,
    'tela 10 deveria descartar teto, decisão e amostra da família anterior.');

  /* tela 11: destaque obrigatório e roteamento condicional. */
  var el11 = elementoFalso();
  var estado11 = { profundidade: 'clara', temperatura: 'fria', familia: 'VC', rota: 'harmonia', contraste: 'baixo', baseNatural: 8 };
  TELAS[11].render(el11, contextoFalso(estado11));
  conferir(el11.innerHTML.indexOf('A altura cede, a temperatura não.') !== -1,
    'tela 11 deveria destacar "A altura cede, a temperatura não."');
  conferir(el11.innerHTML.indexOf('08–10') !== -1, 'tela 11 deveria mostrar a faixa 08–10 da família.');
  conferir(estado11.teto === 10, 'tela 11 deveria registrar o teto 10 para a base 08.');
  conferir(el11.innerHTML.indexOf('escolha da amostra') !== -1,
    'com amostra viável a tela 11 deveria anunciar a escolha da amostra.');

  var el11b = elementoFalso();
  var estado11b = { profundidade: 'clara', temperatura: 'fria', familia: 'VC', rota: 'harmonia', contraste: 'baixo', baseNatural: 1 };
  TELAS[11].render(el11b, contextoFalso(estado11b));
  conferir(estado11b.teto === 6, 'tela 11 deveria registrar o teto 06 para a base 01.');
  conferir(el11b.innerHTML.indexOf('conflito e decisão') !== -1,
    'sem amostra viável a tela 11 deveria anunciar o conflito.');

  /* tela 12: só existe no conflito, decide e registra com data. */
  var el12fora = elementoFalso();
  TELAS[12].render(el12fora, contextoFalso({ familia: 'VC', profundidade: 'clara', temperatura: 'fria', baseNatural: 8, rota: 'harmonia' }));
  conferir(el12fora.innerHTML.indexOf('Esta tela não se aplica') !== -1,
    'tela 12 deveria recusar quando há amostra viável.');

  var estado12 = { familia: 'VC', profundidade: 'clara', temperatura: 'fria', baseNatural: 1, rota: 'harmonia' };
  var el12 = elementoFalso();
  TELAS[12].render(el12, contextoFalso(estado12));
  conferir(el12.innerHTML.indexOf('A pele pede') !== -1 &&
    el12.innerHTML.indexOf('O fio alcança hoje') !== -1 &&
    el12.innerHTML.indexOf('conflito declarado') !== -1,
    'tela 12 deveria montar o painel do conflito.');
  conferir(el12.innerHTML.toLowerCase().indexOf('toque na amostra') === -1,
    'tela 12 não pode dizer "toque na amostra".');
  conferir(el12.innerHTML.indexOf('Adiar a cor e tratar o fio primeiro') !== -1,
    'tela 12 deveria oferecer as duas decisões.');

  estado12.decisaoConflito = { escolha: 'adiar-cor', data: new Date().toISOString() };
  var el12b = elementoFalso();
  TELAS[12].render(el12b, contextoFalso(estado12));
  conferir(el12b.innerHTML.indexOf('Decisão registrada (RN-20)') !== -1,
    'tela 12 deveria mostrar a decisão registrada com data.');

  /* tela 13: só as viáveis, com nota obrigatória. */
  /* base 05 + 4 degraus → teto 09: a 10.1 fica de fora da grade. */
  var estado13 = { familia: 'VC', profundidade: 'clara', temperatura: 'fria', baseNatural: 5, rota: 'harmonia' };
  var el13 = elementoFalso();
  TELAS[13].render(el13, contextoFalso(estado13));
  conferir(el13.innerHTML.indexOf('8.1') !== -1 && el13.innerHTML.indexOf('9.1') !== -1,
    'tela 13 deveria listar as amostras viáveis 8.1 e 9.1.');
  conferir(el13.innerHTML.indexOf('10.1') === -1,
    'tela 13 não deveria listar a amostra 10.1 fora do teto 09.');
  conferir(el13.innerHTML.indexOf('cor de tela é direção; a decisão se confirma com a amostra na mão') !== -1,
    'tela 13 deveria trazer a nota sobre a amostra na mão.');

  /* tela 13 sem amostra viável manda para o conflito, sem grade vazia. */
  var el13b = elementoFalso();
  TELAS[13].render(el13b, contextoFalso({ familia: 'VC', profundidade: 'clara', temperatura: 'fria', baseNatural: 1, rota: 'harmonia' }));
  conferir(el13b.innerHTML.indexOf('Ir para o conflito e decisão') !== -1,
    'tela 13 sem amostra viável deveria mandar para a tela 12.');

  /* lacuna: família sem amostras na matriz → cartão e registro manual, sem inventar tom. */
  var familiaPorSiglaOriginal = DADOS.familiaPorSigla;
  DADOS.familiaPorSigla = function (sigla) {
    if (String(sigla).toUpperCase() === 'ZZ') {
      return { sigla: 'ZZ', nome: 'Família Sem Amostras', faixa: [6, 7], temperatura: 'fria', profundidade: 'media', tetoClareamento: 4, amostras: [] };
    }
    return familiaPorSiglaOriginal(sigla);
  };
  try {
    var elLacuna = elementoFalso();
    TELAS[13].render(elLacuna, contextoFalso({ familia: 'ZZ', profundidade: 'media', temperatura: 'fria', baseNatural: 6, rota: 'harmonia' }));
    conferir(elLacuna.innerHTML.indexOf('A matriz ainda não tem amostras') !== -1,
      'tela 13 deveria mostrar o cartão de lacuna quando a família não tem amostras.');
    conferir(elLacuna.innerHTML.indexOf('Registrar tom manualmente') !== -1,
      'a lacuna deveria permitir o registro manual do tom.');
    conferir(MOTOR.validaEtapa({ familia: 'ZZ', profundidade: 'media', temperatura: 'fria', baseNatural: 6 }, 13).ok === false,
      'a tela 13 com lacuna deveria bloquear sem registro manual.');
    conferir(MOTOR.validaEtapa({
      familia: 'ZZ', profundidade: 'media', temperatura: 'fria', baseNatural: 6,
      amostraEscolhida: { manual: true, descricao: '7.1 da marca usada na bancada', data: new Date().toISOString() }
    }, 13).ok === true, 'a tela 13 com lacuna deveria liberar com registro manual preenchido.');
  } finally {
    DADOS.familiaPorSigla = familiaPorSiglaOriginal;
  }
}

/* ---------- resultado ---------- */

if (falhas.length) {
  console.error('PRESCRIÇÃO: ' + falhas.length + ' falha(s)');
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
} else {
  console.log('PRESCRIÇÃO: ok — família por profundidade × temperatura, calibração, teto/faixa e viabilidade de amostra conferidos.');
}
