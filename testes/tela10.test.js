/* Teste da tela 10 — node puro, sem framework e sem npm.
   Uso: node testes/tela10.test.js
   Sai com código != 0 se a família for chutada sem temperatura, se a calibração
   sair da regra da Ilda ou se a tela 10 voltar a pintar família vinda do cache. */
'use strict';

var DADOS = require('../assets/data.js');
var MOTOR = require('../assets/engine.js');

/* Stub mínimo de window/document só para o registro das telas. */
global.window = { VISAGE_DATA: DADOS, VISAGE_ENGINE: MOTOR };
global.document = {
  addEventListener: function () {},
  removeEventListener: function () {},
  querySelector: function () { return null; },
  getElementById: function () { return null; }
};

var TELAS = require('../assets/telas-prescricao.js');

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

function elementoFalso() {
  return {
    innerHTML: '',
    querySelectorAll: function () { return []; },
    querySelector: function () { return null; }
  };
}

function contextoFalso(estado) {
  var ctx = {
    estado: estado,
    salvamentos: 0,
    recargas: 0,
    salvar: function () { ctx.salvamentos += 1; },
    recarregar: function () { ctx.recargas += 1; },
    atualizar: function () {},
    irPara: function () { return true; }
  };
  return ctx;
}

function renderizar(estado) {
  var el = elementoFalso();
  var ctx = contextoFalso(estado);
  global.window.VISAGE.telas[10].render(el, ctx);
  return { html: el.innerHTML, ctx: ctx };
}

function sigla(familia) {
  return familia && familia.sigla;
}

/* ---------- família prescrita: profundidade × temperatura ---------- */

var COMBINACOES = [
  ['clara', 'fria', 'VC'],
  ['clara', 'quente', 'PC'],
  ['media', 'quente', 'PE'],
  ['media', 'fria', 'VE'],
  ['profunda', 'fria', 'IP'],
  ['profunda', 'quente', 'OP']
];

COMBINACOES.forEach(function (c) {
  var familia = MOTOR.familiaPrescrita(c[0], c[1]);
  conferir(sigla(familia) === c[2],
    'familiaPrescrita(' + c[0] + ', ' + c[1] + ') deveria ser ' + c[2] + '; veio ' + JSON.stringify(sigla(familia)) + '.');
  conferir(!!familia && DADOS.FAMILIAS.indexOf(familia) !== -1,
    'familiaPrescrita(' + c[0] + ', ' + c[1] + ') deveria devolver a família de FAMILIAS.');
});

/* Acento e caixa não mudam a leitura. */
conferir(sigla(MOTOR.familiaPrescrita('Clara', 'FRIA')) === 'VC', 'a leitura deveria aceitar caixa alta.');
conferir(sigla(MOTOR.familiaPrescrita('média', 'Quente')) === 'PE', 'a leitura deveria aceitar acento em "média".');
conferir(sigla(MOTOR.familiaPrescrita('  profunda ', ' fria ')) === 'IP', 'espaços em volta não podem mudar a família.');

/* Sem temperatura registrada NÃO existe família — nunca chutar. */
conferir(MOTOR.familiaPrescrita('clara', null) === null, 'temperatura null deveria devolver null.');
conferir(MOTOR.familiaPrescrita('clara', '') === null, 'temperatura vazia deveria devolver null.');
conferir(MOTOR.familiaPrescrita('clara', undefined) === null, 'temperatura undefined deveria devolver null.');
conferir(MOTOR.familiaPrescrita('clara', '   ') === null, 'temperatura só com espaços deveria devolver null.');
conferir(MOTOR.familiaPrescrita('clara') === null, 'sem o argumento da temperatura deveria devolver null.');
conferir(MOTOR.familiaPrescrita(null, 'fria') === null, 'sem profundidade não há família.');
conferir(MOTOR.familiaPrescrita('', 'quente') === null, 'profundidade vazia deveria devolver null.');
conferir(MOTOR.familiaPrescrita('clara', 'morna') === null, 'temperatura fora de fria/neutra/quente deveria devolver null.');
conferir(MOTOR.familiaPrescrita('oliva', 'fria') === null, 'profundidade fora da spec deveria devolver null.');
conferir(MOTOR.familiaPrescrita('clara', 0) === null, 'temperatura não textual deveria devolver null.');

/* Neutra é leitura registrada: cai na fria do par (menor contraste térmico). */
conferir(sigla(MOTOR.familiaPrescrita('clara', 'neutra')) === 'VC', 'neutra em pele clara deveria cair em VC.');
conferir(sigla(MOTOR.familiaPrescrita('media', 'NEUTRA')) === 'VE', 'neutra em pele média deveria cair em VE.');
conferir(sigla(MOTOR.familiaPrescrita('profunda', 'neutra')) === 'IP', 'neutra em pele profunda deveria cair em IP.');

/* ---------- calibração de contraste ---------- */

conferir(MOTOR.calibracaoDeContraste('baixo') === 'Suave', "calibracaoDeContraste('baixo') deveria ser Suave.");
conferir(MOTOR.calibracaoDeContraste('medio') === 'Suave', "calibracaoDeContraste('medio') deveria ser Suave.");
conferir(MOTOR.calibracaoDeContraste('médio') === 'Suave', "calibracaoDeContraste('médio') deveria ser Suave.");
conferir(MOTOR.calibracaoDeContraste('ALTO') === 'Intensa', "calibracaoDeContraste('alto') deveria ser Intensa.");

esperaErro('calibracaoDeContraste("nenhum")', function () { MOTOR.calibracaoDeContraste('nenhum'); }, 'Contraste inválido');
esperaErro('calibracaoDeContraste(null)', function () { MOTOR.calibracaoDeContraste(null); }, 'Contraste inválido');
esperaErro('calibracaoDeContraste("")', function () { MOTOR.calibracaoDeContraste(''); }, 'Contraste inválido');

/* ---------- tela 10 — o defeito: família sem temperatura ---------- */

var legado = { rota: 'harmonia', profundidade: 'clara', contraste: 'alto', familia: 'VC' };
var semTemperatura = renderizar(legado);

conferir(semTemperatura.html.indexOf('Verão Claro · VC') === -1,
  'tela 10 pintou a família sem temperatura registrada.');
conferir(semTemperatura.html.indexOf('Família prescrita') === -1,
  'tela 10 mostrou o bloco de família sem temperatura registrada.');
conferir(semTemperatura.html.indexOf('Calibração prescrita') === -1,
  'tela 10 mostrou a calibração prescrita sem temperatura registrada.');
conferir(semTemperatura.html.indexOf('Intensa') === -1,
  'tela 10 mostrou a calibração sem família derivada.');
conferir(semTemperatura.html.indexOf('Sem temperatura registrada não há família a derivar.') !== -1,
  'tela 10 não diz que sem temperatura não há família a derivar.');
conferir(semTemperatura.html.indexOf('Temperatura (leitura do Kit de Tecidos)') !== -1,
  'tela 10 não rotula a temperatura como leitura do Kit de Tecidos.');
conferir(semTemperatura.html.indexOf('A temperatura vem do Kit de Tecidos; o app não a estima.') !== -1,
  'tela 10 não avisa que o app não estima a temperatura.');
conferir(semTemperatura.html.indexOf('data-temperatura="fria"') !== -1, 'tela 10 não oferece o botão Fria.');
conferir(semTemperatura.html.indexOf('data-temperatura="neutra"') !== -1, 'tela 10 não oferece o botão Neutra.');
conferir(semTemperatura.html.indexOf('data-temperatura="quente"') !== -1, 'tela 10 não oferece o botão Quente.');

var semProfundidade = renderizar({ rota: 'harmonia', temperatura: 'fria', familia: 'VC' });
conferir(semProfundidade.html.indexOf('Verão Claro · VC') === -1,
  'tela 10 pintou família sem a profundidade registrada.');
conferir(semProfundidade.html.indexOf('Faltam a profundidade da pele') !== -1,
  'tela 10 não diz que falta a profundidade da pele.');

/* ---------- tela 10 — com temperatura, deriva sempre da leitura ---------- */

var cacheErrado = { rota: 'harmonia', profundidade: 'clara', temperatura: 'quente', contraste: 'baixo', familia: 'VC' };
var comTemperatura = renderizar(cacheErrado);

conferir(comTemperatura.html.indexOf('Primavera Clara · PC') !== -1,
  'tela 10 deveria derivar PC de clara × quente; veio outro painel.');
conferir(comTemperatura.html.indexOf('Verão Claro · VC') === -1,
  'tela 10 usou a família cacheada no estado em vez de derivar.');
conferir(comTemperatura.html.indexOf('Suave') !== -1, 'tela 10 não mostra a calibração Suave para contraste baixo.');
conferir(comTemperatura.html.indexOf('clara · quente') !== -1, 'tela 10 não mostra profundidade × temperatura.');
conferir(cacheErrado.familia === 'PC', 'a família do estado deveria ser sincronizada com a sigla derivada; veio ' + JSON.stringify(cacheErrado.familia) + '.');
conferir(comTemperatura.html.indexOf('aria-pressed="true"') !== -1, 'tela 10 não marca a temperatura registrada.');

var trocouProfundidade = renderizar({ rota: 'harmonia', profundidade: 'profunda', temperatura: 'quente', familia: 'VC', contraste: 'alto' });
conferir(trocouProfundidade.html.indexOf('Outono Profundo · OP') !== -1,
  'tela 10 não acompanhou a troca de profundidade feita na tela 4.');

var neutraNaTela = renderizar({ rota: 'harmonia', profundidade: 'media', temperatura: 'neutra', contraste: 'medio' });
conferir(neutraNaTela.html.indexOf('Verão Essencial · VE') !== -1, 'tela 10 não deriva a família a partir da leitura neutra.');
conferir(neutraNaTela.html.indexOf('media · neutra') !== -1, 'tela 10 não mostra a leitura neutra.');

/* ---------- tela 10 — RN-24: o rótulo muda com a rota ---------- */

var harmonia = renderizar({ rota: 'harmonia', profundidade: 'clara', temperatura: 'fria', contraste: 'baixo' });
conferir(harmonia.html.indexOf('Família prescrita') !== -1, 'Rota Harmonia deveria dizer "Família prescrita".');
conferir(harmonia.html.indexOf('Calibração prescrita') !== -1, 'Rota Harmonia deveria dizer "Calibração prescrita".');

var estilo = renderizar({ rota: 'estilo', profundidade: 'clara', temperatura: 'fria', contraste: 'alto' });
conferir(estilo.html.indexOf('Ponto de partida') !== -1, 'Rota Estilo deveria dizer "Ponto de partida".');
conferir(estilo.html.indexOf('Calibração proposta') !== -1, 'Rota Estilo deveria dizer "Calibração proposta".');
conferir(estilo.html.indexOf('Família prescrita') === -1, 'Rota Estilo não pode dizer "Família prescrita".');

var iris = renderizar({ rota: 'iris', profundidade: 'clara', temperatura: 'fria', contraste: 'baixo' });
conferir(iris.html.indexOf('Família de referência') !== -1, 'Rota Íris deveria dizer "Família de referência".');
conferir(iris.html.indexOf('Calibração de referência') !== -1, 'Rota Íris deveria dizer "Calibração de referência".');

conferir(harmonia.html.indexOf('RN-24') !== -1, 'tela 10 perdeu a ressalva do rótulo por rota (RN-24).');

/* ---------- resultado ---------- */

if (falhas.length) {
  console.error('TELA 10: ' + falhas.length + ' falha(s)');
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
} else {
  console.log('TELA 10: ok — família só nasce com temperatura, neutra documentada, calibração Suave/Intensa e painel derivado da leitura (não do cache).');
}
