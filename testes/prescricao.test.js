/* Teste das telas 10 a 13 — node puro, sem framework e sem npm.
   Uso: node testes/prescricao.test.js
   Sai com código != 0 se o registro, a calibração, a família da sessão, o
   filtro do teto ou o bloqueio das telas 12/13 quebrarem. */
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

/* Elemento com os dois botões de temperatura, para exercitar o clique real. */
function elementoComTemperatura() {
  var botoes = ['fria', 'quente'].map(function (valor) {
    return {
      valor: valor,
      listeners: [],
      getAttribute: function (nome) { return nome === 'data-temperatura' ? valor : null; },
      addEventListener: function (evento, funcao) { this.listeners.push(funcao); }
    };
  });
  return {
    innerHTML: '',
    botoes: botoes,
    querySelectorAll: function () { return botoes; },
    querySelector: function () { return null; }
  };
}

function renderizar(numero, estado) {
  var el = elementoFalso();
  var ctx = contextoFalso(estado);
  var tela = global.window.VISAGE.telas[numero];
  tela.render(el, ctx);
  return { html: el.innerHTML, ctx: ctx };
}

function codigosDaGrade(html) {
  var codigos = [];
  var re = /data-amostra="([^"]+)"/g;
  var achado;
  while ((achado = re.exec(html)) !== null) codigos.push(achado[1]);
  return codigos;
}

/* ---------- registro ---------- */

[10, 11, 12, 13].forEach(function (numero) {
  var registro = global.window.VISAGE && global.window.VISAGE.telas && global.window.VISAGE.telas[numero];
  conferir(!!registro, 'tela ' + numero + ' não registrada em window.VISAGE.telas.');
  if (!registro) return;
  conferir(typeof registro.titulo === 'string' && registro.titulo.trim().length > 0,
    'tela ' + numero + ' sem título.');
  conferir(registro.bloco === 'prescricao', 'tela ' + numero + ' fora do bloco prescricao (veio "' + registro.bloco + '").');
  conferir(typeof registro.render === 'function', 'tela ' + numero + ' sem render(el, ctx).');
});

/* ---------- calibração por contraste ---------- */

conferir(TELAS.calibracaoPorContraste('baixo') === 'Suave',
  "calibracaoPorContraste('baixo') deveria ser Suave; veio " + JSON.stringify(TELAS.calibracaoPorContraste('baixo')) + '.');
conferir(TELAS.calibracaoPorContraste('medio') === 'Suave',
  "calibracaoPorContraste('medio') deveria ser Suave.");
conferir(TELAS.calibracaoPorContraste('médio') === 'Suave',
  "calibracaoPorContraste('médio') (com acento) deveria ser Suave.");
conferir(TELAS.calibracaoPorContraste('alto') === 'Intensa',
  "calibracaoPorContraste('alto') deveria ser Intensa.");

esperaErro('calibracaoPorContraste("nenhum")', function () { TELAS.calibracaoPorContraste('nenhum'); }, 'Contraste inválido');
esperaErro('calibracaoPorContraste(null)', function () { TELAS.calibracaoPorContraste(null); }, 'Contraste inválido');

/* ---------- família prescrita ---------- */

var COMBINACOES = [
  ['clara', 'fria', 'VC'],
  ['clara', 'quente', 'PC'],
  ['media', 'fria', 'VE'],
  ['media', 'quente', 'PE'],
  ['profunda', 'fria', 'IP'],
  ['profunda', 'quente', 'OP']
];

COMBINACOES.forEach(function (c) {
  var familia = TELAS.familiaPrescrita({ profundidade: c[0], temperatura: c[1] });
  conferir(!!familia && familia.sigla === c[2],
    'família de ' + c[0] + ' × ' + c[1] + ' deveria ser ' + c[2] + '; veio ' + JSON.stringify(familia && familia.sigla) + '.');
});

conferir(TELAS.familiaPrescrita({ profundidade: 'clara' }) === null,
  'sem temperatura a família não pode ser inventada.');
conferir(TELAS.familiaPrescrita({ temperatura: 'fria' }) === null,
  'sem profundidade a família não pode ser derivada.');
conferir(TELAS.familiaPrescrita({ profundidade: 'clara', temperatura: 'morna' }) === null,
  'temperatura fora de fria/quente deveria devolver null.');

/* ---------- MOTOR.familiaDaSessao: o cache não prevalece ---------- */

var cacheAntigo = MOTOR.familiaDaSessao({ profundidade: 'clara', temperatura: 'fria', familia: 'PE' });
conferir(!!cacheAntigo && cacheAntigo.sigla === 'VC',
  "familiaDaSessao(clara × fria, familia 'PE' em cache) deveria derivar VC; veio " +
  JSON.stringify(cacheAntigo && cacheAntigo.sigla) + '.');

var derivadaQuente = MOTOR.familiaDaSessao({ profundidade: 'media', temperatura: 'quente' });
conferir(!!derivadaQuente && derivadaQuente.sigla === 'PE',
  "familiaDaSessao(media × quente) deveria ser PE; veio " +
  JSON.stringify(derivadaQuente && derivadaQuente.sigla) + '.');

conferir(MOTOR.familiaDaSessao({ profundidade: 'clara' }) === null,
  'sem temperatura não há família a derivar.');
conferir(MOTOR.familiaDaSessao({}) === null,
  'estado vazio não pode produzir família.');
conferir(MOTOR.familiaDaSessao({ profundidade: 'clara', temperatura: 'fria', familia: 'XX' }).sigla === 'VC',
  'familia inválida no cache não pode interferir na derivação.');

/* ---------- MOTOR.calibracaoDeContraste ---------- */

conferir(MOTOR.calibracaoDeContraste('baixo') === 'Suave',
  "calibracaoDeContraste('baixo') deveria ser Suave; veio " + JSON.stringify(MOTOR.calibracaoDeContraste('baixo')) + '.');
conferir(MOTOR.calibracaoDeContraste('medio') === 'Suave',
  "calibracaoDeContraste('medio') deveria ser Suave.");
conferir(MOTOR.calibracaoDeContraste('médio') === 'Suave',
  "calibracaoDeContraste('médio') (com acento) deveria ser Suave.");
conferir(MOTOR.calibracaoDeContraste('alto') === 'Intensa',
  "calibracaoDeContraste('alto') deveria ser Intensa.");
esperaErro('MOTOR.calibracaoDeContraste("nenhum")',
  function () { MOTOR.calibracaoDeContraste('nenhum'); }, 'Contraste inválido');

/* ---------- tela 13: nunca acima do teto ---------- */

DADOS.FAMILIAS.forEach(function (familia) {
  DADOS.ALTURAS.forEach(function (base) {
    var estado = { familia: familia.sigla, baseNatural: base, profundidade: familia.profundidade, temperatura: familia.temperatura };
    var teto = TELAS.tetoDoEstado(estado);
    conferir(Number.isInteger(teto), '[' + familia.sigla + ' base ' + base + '] teto deveria ser uma altura de mercado; veio ' + teto + '.');

    var amostras = TELAS.amostrasDaTela13(estado);
    conferir(Array.isArray(amostras), '[' + familia.sigla + ' base ' + base + '] amostrasDaTela13 não devolveu array.');

    amostras.forEach(function (amostra) {
      conferir(amostra.altura <= teto,
        '[' + familia.sigla + ' base ' + base + '] amostra ' + amostra.codigo + ' (altura ' + amostra.altura + ') acima do teto ' + teto + '.');
      var pertence = familia.amostras.some(function (a) { return a.codigo === amostra.codigo; });
      conferir(pertence, '[' + familia.sigla + ' base ' + base + '] amostra ' + amostra.codigo + ' não é da família.');
    });

    var esperadas = familia.amostras.filter(function (a) { return a.altura <= teto; }).length;
    conferir(amostras.length === esperadas,
      '[' + familia.sigla + ' base ' + base + '] esperava ' + esperadas + ' amostras dentro do teto; veio ' + amostras.length + '.');
  });
});

/* Caso de conflito medido: pele clara/fria (VC, faixa 08–10) com base 01 → teto 06. */
var conflito = { familia: 'VC', baseNatural: 1 };
conferir(TELAS.tetoDoEstado(conflito) === 6, 'teto de VC com base 01 deveria ser 06; veio ' + TELAS.tetoDoEstado(conflito) + '.');
conferir(TELAS.amostrasDaTela13(conflito).length === 0, 'VC com base 01 não tem amostra viável; a lista deveria ser vazia.');
conferir(TELAS.amostrasDaTela13({}) .length === 0, 'sem família e sem base a tela 13 não pode listar amostra nenhuma.');

/* ---------- tela 12: decisão obrigatória ---------- */

var semDecisao = { familia: 'VC', baseNatural: 1 };
var cheque12 = TELAS.validarAvancar(12, semDecisao);
conferir(cheque12.ok === false, 'tela 12 permitiu seguir sem decisão registrada.');
conferir(typeof cheque12.motivo === 'string' && cheque12.motivo.length > 0, 'bloqueio da tela 12 veio sem motivo.');

esperaErro('registrarDecisao(estado, "outra")', function () { TELAS.registrarDecisao(semDecisao, 'outra'); }, 'Decisão inválida');

var decisao = TELAS.registrarDecisao(semDecisao, 'adiar', new Date('2026-11-11T12:00:00Z'));
conferir(decisao.escolha === 'adiar', 'decisão não guardou a escolha.');
conferir(decisao.rotulo.indexOf('Adiar a cor') === 0, 'decisão guardou rótulo inesperado: ' + decisao.rotulo);
conferir(decisao.data === '2026-11-11T12:00:00.000Z', 'RN-20: decisão sem data/hora ISO; veio ' + decisao.data + '.');
conferir(TELAS.validarAvancar(12, semDecisao).ok === true, 'tela 12 continuou bloqueada depois da decisão.');

semDecisao.decisaoConflito = { escolha: 'inventada' };
conferir(TELAS.validarAvancar(12, semDecisao).ok === false, 'decisão com escolha inválida liberou a tela 12.');

/* ---------- tela 13: seleção obrigatória e dentro do teto ---------- */

var viavel = { familia: 'VC', baseNatural: 5, profundidade: 'clara', temperatura: 'fria' };
conferir(TELAS.validarAvancar(13, viavel).ok === false, 'tela 13 permitiu seguir sem escolher amostra.');

var amostrasViaveis = TELAS.amostrasDaTela13(viavel);
conferir(amostrasViaveis.length > 0, 'o cenário de teste deveria ter amostra viável.');

esperaErro('registrarAmostra("10.1") com teto 07', function () { TELAS.registrarAmostra(viavel, '10.1'); }, 'não está dentro do teto');

var escolha = TELAS.registrarAmostra(viavel, amostrasViaveis[0].codigo, new Date('2026-11-11T12:00:00Z'));
conferir(escolha.codigo === amostrasViaveis[0].codigo, 'amostra escolhida não foi a informada.');
conferir(typeof escolha.data === 'string' && escolha.data.length > 0, 'amostra escolhida sem data.');
conferir(TELAS.validarAvancar(13, viavel).ok === true, 'tela 13 continuou bloqueada depois da escolha.');

viavel.amostraEscolhida = { codigo: '10.1', nome: 'Platinado Cinza', altura: 10 };
conferir(TELAS.validarAvancar(13, viavel).ok === false, 'amostra fora do teto no estado liberou a tela 13.');

/* ---------- telas 10 e 11 não bloqueiam ---------- */

conferir(TELAS.validarAvancar(10, {}).ok === true, 'tela 10 não deveria bloquear.');
conferir(TELAS.validarAvancar(11, {}).ok === true, 'tela 11 não deveria bloquear.');

/* ---------- render: conteúdo obrigatório ---------- */

var estadoCompleto = {
  rota: 'harmonia',
  profundidade: 'clara',
  temperatura: 'fria',
  baseNatural: 5,
  contraste: 'baixo',
  familia: 'VC'
};

var tela10 = renderizar(10, estadoCompleto);
conferir(tela10.html.indexOf('Verão Claro · VC') !== -1, 'tela 10 não mostra a família com sigla.');
conferir(tela10.html.indexOf('Suave') !== -1, 'tela 10 não mostra a calibração Suave para contraste baixo.');
conferir(tela10.html.indexOf('clara · fria') !== -1, 'tela 10 não mostra profundidade × temperatura.');
conferir(tela10.html.indexOf('baixo') !== -1, 'tela 10 não mostra o contraste.');
conferir(tela10.html.indexOf('RN-24') !== -1, 'tela 10 perdeu a ressalva do rótulo por rota (RN-24).');

/* Sem temperatura: nem família nem calibração — e o registro é oferecido. */
var tela10SemTemperatura = renderizar(10, { rota: 'harmonia', profundidade: 'clara', contraste: 'baixo', familia: 'PE' });
conferir(tela10SemTemperatura.html.indexOf('Sem temperatura registrada não há família a derivar') !== -1,
  'tela 10 sem temperatura precisa dizer que não há família a derivar.');
conferir(tela10SemTemperatura.html.indexOf('Primavera Essencial') === -1,
  'a família em cache (PE) não pode aparecer sem temperatura registrada.');
conferir(tela10SemTemperatura.html.indexOf('Família prescrita') === -1,
  'tela 10 sem temperatura não pode afirmar família prescrita.');
conferir(tela10SemTemperatura.html.indexOf('Calibração prescrita') === -1,
  'tela 10 sem temperatura não pode afirmar calibração prescrita.');
conferir(tela10SemTemperatura.html.indexOf('data-temperatura="fria"') !== -1,
  'tela 10 precisa oferecer a leitura fria do Kit de Tecidos.');
conferir(tela10SemTemperatura.html.indexOf('data-temperatura="quente"') !== -1,
  'tela 10 precisa oferecer a leitura quente do Kit de Tecidos.');
conferir(tela10SemTemperatura.html.indexOf('Kit de Tecidos') !== -1,
  'tela 10 precisa dizer que a temperatura vem do Kit de Tecidos.');
conferir(tela10SemTemperatura.html.indexOf('o app não a estima') !== -1,
  'tela 10 precisa dizer que o app não estima a temperatura.');
conferir(tela10SemTemperatura.html.indexOf('data-temperatura="neutra"') === -1,
  'tela 10 não pode inventar opção neutra de temperatura.');
conferir((tela10SemTemperatura.html.match(/data-temperatura="/g) || []).length === 2,
  'tela 10 deve oferecer exatamente duas leituras de temperatura (fria e quente).');

/* A leitura nova derruba o cache: clara × fria com PE gravado mostra VC. */
var tela10ComCacheAntigo = renderizar(10, { rota: 'harmonia', profundidade: 'clara', temperatura: 'fria', contraste: 'baixo', familia: 'PE' });
conferir(tela10ComCacheAntigo.html.indexOf('Verão Claro · VC') !== -1,
  'a família precisa ser derivada da leitura nova, não do cache (esperava Verão Claro · VC).');
conferir(tela10ComCacheAntigo.html.indexOf('Primavera Essencial') === -1,
  'a família antiga (PE) não pode prevalecer sobre a leitura atual.');

/* Clique real na leitura do Kit: deriva a família e grava no prontuário. */
var estadoClique = { rota: 'harmonia', profundidade: 'clara', baseNatural: 5, contraste: 'baixo', familia: 'PE' };
var elClique = elementoComTemperatura();
var ctxClique = contextoFalso(estadoClique);
global.window.VISAGE.telas[10].render(elClique, ctxClique);
conferir(elClique.botoes[0].listeners.length === 1 && elClique.botoes[1].listeners.length === 1,
  'os dois botões de temperatura deveriam ter handler de clique.');

elClique.botoes[1].listeners[0](); // quente
conferir(estadoClique.temperatura === 'quente', 'o clique deveria registrar temperatura quente.');
conferir(estadoClique.familia === 'PC', 'clara × quente deveria gravar PC; veio ' + JSON.stringify(estadoClique.familia) + '.');
conferir(ctxClique.recargas === 1, 'o clique deveria recarregar a tela.');

elClique.botoes[0].listeners[0](); // fria, trocando a leitura
conferir(estadoClique.temperatura === 'fria', 'o clique deveria trocar a temperatura para fria.');
conferir(estadoClique.familia === 'VC', 'clara × fria deveria substituir PC por VC; veio ' + JSON.stringify(estadoClique.familia) + '.');
conferir(estadoClique.teto === 9, 'o teto deveria acompanhar a base natural 05; veio ' + JSON.stringify(estadoClique.teto) + '.');

var tela10Iris = renderizar(10, { rota: 'iris', profundidade: 'clara', temperatura: 'fria', contraste: 'baixo' });
conferir(tela10Iris.html.indexOf('Família prescrita') !== -1,
  'na Rota Íris o rótulo deveria ser "Família prescrita".');
conferir(tela10Iris.html.indexOf('Calibração prescrita') !== -1,
  'na Rota Íris o rótulo deveria ser "Calibração prescrita".');

var tela10Estilo = renderizar(10, { rota: 'estilo', profundidade: 'clara', temperatura: 'fria', contraste: 'alto', familia: 'VC' });
conferir(tela10Estilo.html.indexOf('Família proposta') !== -1, 'na Rota Estilo o rótulo deveria ser "Família proposta".');
conferir(tela10Estilo.html.indexOf('Calibração proposta') !== -1, 'na Rota Estilo o rótulo deveria ser "Calibração proposta".');
conferir(tela10Estilo.html.toLowerCase().indexOf('prescrit') === -1,
  'a Rota Estilo nunca pode escrever "prescrita".');
conferir(tela10Estilo.html.indexOf('Intensa') !== -1, 'contraste alto deveria dar calibração Intensa.');

var tela11 = renderizar(11, estadoCompleto);
conferir(tela11.html.indexOf('A altura cede, a temperatura não.') !== -1, 'tela 11 perdeu o destaque obrigatório.');
conferir(tela11.html.indexOf('Teto de clareamento') !== -1, 'tela 11 não mostra o teto.');
conferir(tela11.html.indexOf('Faixa da família') !== -1, 'tela 11 não mostra a faixa da família.');
conferir(tela11.html.indexOf('05') !== -1, 'tela 11 não mostra a base natural em duas casas.');

/* ---------- tela 11: teto em degraus contados da base natural ---------- */

conferir(MOTOR.tetoDeClareamento(1, 4) === 6,
  'base 01 + 4 degraus deveria alcançar 06 (03, 04, 05, 06); veio ' + MOTOR.tetoDeClareamento(1, 4) + '.');
conferir(MOTOR.tetoDeClareamento(5, 4) === 9,
  'base 05 + 4 degraus deveria alcançar 09; veio ' + MOTOR.tetoDeClareamento(5, 4) + '.');
conferir(MOTOR.tetoDeClareamento(10, 4) === 10,
  'o teto não pode passar da altura 10.');
conferir(MOTOR.tetoDeClareamento(3, 4) === 7,
  'base 03 + 4 degraus deveria alcançar 07 (04, 05, 06, 07); veio ' + MOTOR.tetoDeClareamento(3, 4) + '.');
conferir(TELAS.tetoDoEstado({ profundidade: 'clara', temperatura: 'fria', baseNatural: 5 }) === 9,
  'o teto de VC com base 05 deveria ser 09 (4 degraus), não a altura absoluta 04.');
conferir(TELAS.tetoDoEstado({ profundidade: 'clara', temperatura: 'fria', baseNatural: 5 }) !== 4,
  'o teto não pode ser lido como altura absoluta (04).');

var viaveisNove = MOTOR.amostrasViaveis('VC', 9).map(function (a) { return a.codigo; });
conferir(viaveisNove.indexOf('8.1') !== -1 && viaveisNove.indexOf('9.1') !== -1,
  'o teto 09 deveria manter 8.1 e 9.1 viáveis; veio ' + JSON.stringify(viaveisNove) + '.');
conferir(viaveisNove.indexOf('10.1') === -1,
  'o teto 09 não pode manter a amostra 10.1 viável.');
conferir(MOTOR.rotaDaTela11('VC', 9) === 13,
  'com amostra viável a tela 11 deveria rotear para 13.');
conferir(MOTOR.rotaDaTela11('VC', 6) === 12,
  'sem amostra viável a tela 11 deveria rotear para 12.');

var tela12 = renderizar(12, { familia: 'VC', baseNatural: 1, rota: 'harmonia' });
conferir(tela12.html.indexOf('conflito declarado') !== -1, 'tela 12 não declara o conflito.');
conferir(tela12.html.indexOf('A pele pede') !== -1, 'tela 12 não mostra o que a pele pede.');
conferir(tela12.html.indexOf('O fio alcança hoje') !== -1, 'tela 12 não mostra o alcance do fio.');
conferir(tela12.html.indexOf('Entregar o ponto mais alto') !== -1, 'tela 12 não oferece a decisão de entregar o ponto mais alto.');
conferir(tela12.html.indexOf('Adiar a cor e tratar o fio primeiro') !== -1, 'tela 12 não oferece a decisão de adiar.');
conferir(tela12.html.indexOf('Toque na amostra') === -1, 'tela 12 não pode repetir a instrução da tela 13.');
conferir(codigosDaGrade(tela12.html).length === 0, 'tela 12 não pode exibir grade de amostras.');

var tela13 = renderizar(13, viavel);
var codigosRender = codigosDaGrade(tela13.html);
conferir(codigosRender.length > 0, 'tela 13 com amostra viável não renderizou a grade.');
var teto13 = TELAS.tetoDoEstado(viavel);
codigosRender.forEach(function (codigo) {
  var amostra = DADOS.familiaPorSigla('VC').amostras.filter(function (a) { return a.codigo === codigo; })[0];
  conferir(!!amostra, 'tela 13 renderizou amostra fora da família: ' + codigo + '.');
  conferir(amostra && amostra.altura <= teto13, 'tela 13 renderizou ' + codigo + ' acima do teto ' + teto13 + '.');
});
conferir(tela13.html.indexOf('cor de tela é direção') !== -1, 'tela 13 perdeu a nota da amostra física.');

var tela13Conflito = renderizar(13, { familia: 'VC', baseNatural: 1 });
conferir(codigosDaGrade(tela13Conflito.html).length === 0, 'tela 13 em conflito não pode listar amostra.');
conferir(tela13Conflito.html.indexOf('Nenhuma amostra viável') !== -1, 'tela 13 em conflito precisa dizer que não há amostra viável.');

/* ---------- resultado ---------- */

if (falhas.length) {
  console.error('TELAS 10-13: ' + falhas.length + ' falha(s)');
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
} else {
  console.log('TELAS 10-13: ok — registro, calibração Suave/Intensa, família pela leitura, teto respeitado nas 6 famílias × 9 bases, tela 12 sem decisão bloqueada e tela 13 só com amostras viáveis.');
}
