/* Teste da tela 17 — node puro, sem framework e sem npm.
   Uso: node testes/telas-dossie.test.js
   Sai com código != 0 se o dossiê perder conteúdo obrigatório, um dos botões
   ou deixar de registrar a tela no stub. */
'use strict';

var fs = require('fs');
var path = require('path');
var DADOS = require('../assets/data.js');
var MOTOR = require('../assets/engine.js');
var DOSSIE = require('../assets/telas-dossie.js');

var falhas = [];

function falhar(mensagem) {
  falhas.push(mensagem);
}

function conferir(condicao, mensagem) {
  if (!condicao) falhar(mensagem);
}

function contem(html, trecho, contexto) {
  if (html.indexOf(trecho) === -1) {
    falhar(contexto + ': o HTML não contém ' + JSON.stringify(trecho) + '.');
  }
}

function naoContem(html, trecho, contexto) {
  if (html.indexOf(trecho) !== -1) {
    falhar(contexto + ': o HTML não deveria conter ' + JSON.stringify(trecho) + '.');
  }
}

function semErro(descricao, funcao) {
  try {
    return funcao();
  } catch (err) {
    falhar(descricao + ': lançou erro — ' + (err && err.message ? err.message : err));
    return null;
  }
}

/* ---------- registro da tela no stub ---------- */

var registraram = [];
var stub = {
  telas: {},
  registrarTela: function (n, definicao) {
    registraram.push(n);
    stub.telas[n] = definicao;
  }
};

semErro('DOSSIE.registrar(stub)', function () { DOSSIE.registrar(stub); });

conferir(registraram.length === 1 && registraram[0] === 17,
  'registrar deve registrar exatamente a tela 17; veio ' + JSON.stringify(registraram) + '.');
conferir(stub.telas[17] && typeof stub.telas[17] === 'object', 'tela 17 não foi registrada no stub.');
conferir(stub.telas[17] && stub.telas[17].titulo === 'Dossiê final', 'título registrado diverge do esperado.');
conferir(stub.telas[17] && stub.telas[17].bloco === 'fechamento', 'a tela 17 pertence ao bloco fechamento.');
conferir(stub.telas[17] && typeof stub.telas[17].render === 'function', 'a tela 17 precisa expor render(el, ctx).');

var semRegistrador = { telas: {} };
semErro('DOSSIE.registrar cria o stub quando falta registrarTela', function () { DOSSIE.registrar(semRegistrador); });
conferir(semRegistrador.telas[17] && typeof semRegistrador.telas[17].render === 'function',
  'registrar deveria criar registrarTela quando o shell ainda não o definiu.');

/* ---------- estado completo de uma consultoria ---------- */

var completo = {
  cliente: { nome: 'Marina Albuquerque', contato: '(11) 98888-0001' },
  desejo: 'queria um loiro mas sem ficar amarelo',
  rota: 'harmonia',
  rotaRotulo: 'prescrita',
  profundidade: 'clara',
  baseNatural: 8,
  contraste: 'baixo',
  contrasteAjuste: null,
  saudeFio: 'comporta',
  formatoRosto: 'redondo',
  familia: 'VC',
  teto: 10,
  calibracao: 'Suave',
  amostra: { codigo: '9.1', nome: 'Loiro Cinza Claro', altura: 9 },
  receita: 'Pré-clareamento 9.1 + 6 vol, 25 min; tonalizante 9.1 + 1,5% por 15 min.',
  valorConsultoria: '420,00',
  valorCor: '680,00',
  manutencao: 'Retoque de raiz em 6 semanas; máscara tonalizante a cada 15 dias.',
  cuidadosDiarios: 'Lavagem com shampoo sem sulfato, protetor térmico antes do secador.',
  observar: 'Amarelamento nas pontas e ressecamento do comprimento.',
  dataRetorno: '2026-12-15',
  dataAtendimento: '2026-11-11',
  fotoRegistrada: true
};

var html = semErro('montarDossie(estado completo)', function () { return DOSSIE.montarDossie(completo); });
if (typeof html !== 'string') {
  falhar('montarDossie deveria devolver string; veio ' + typeof html + '.');
  html = '';
}

/* ---------- conteúdo obrigatório ---------- */

contem(html, 'Marina Albuquerque', 'capa');
contem(html, '11 de novembro de 2026', 'capa com data do atendimento');
contem(html, 'Dossiê de consultoria', 'capa');
contem(html, 'Verão Claro', 'diagnóstico com a família');
contem(html, 'VC', 'diagnóstico com a sigla da família');
contem(html, 'Harmonia', 'diagnóstico com a rota');
contem(html, 'Suave', 'diagnóstico com a calibração');
contem(html, 'Clara', 'diagnóstico com a profundidade');
contem(html, 'fria', 'diagnóstico com a temperatura');
contem(html, 'BAIXO', 'diagnóstico com o contraste');
contem(html, 'base 08', 'diagnóstico com a base natural');
contem(html, 'até 10', 'diagnóstico com o teto');
contem(html, '08 a 10', 'diagnóstico com a faixa alcançável');
contem(html, 'Loiro Cinza Claro', 'diagnóstico com a amostra escolhida');
contem(html, 'Redondo', 'seção do formato do rosto');
naoContem(html, 'formato de referência, quase tudo favorece', 'seção do formato deveria usar o formato redondo do estado');
contem(html, 'volume no topo, luz que cria altura, evitar largura nas laterais', 'direcionamento do formato');
contem(html, 'Seus neutros', 'paleta de vestuário');
contem(html, 'Cores que roubam sua luz', 'paleta de vestuário');
contem(html, 'Orientação de vestuário — não é consultoria de imagem.', 'rodapé da paleta');
contem(html, 'Pré-clareamento 9.1', 'receita técnica');
contem(html, 'Retoque de raiz em 6 semanas', 'plano de manutenção');
contem(html, 'Lavagem com shampoo sem sulfato', 'cuidados diários');
contem(html, 'Amarelamento nas pontas', 'o que observar');
contem(html, '15 de dezembro de 2026', 'data prevista de retorno');
contem(html, 'Termo de autorização de uso de imagem', 'termo LGPD');
contem(html, 'Lei nº 13.709/2018', 'cláusula LGPD com a lei');
contem(html, 'revogada por escrito', 'cláusula LGPD com revogação');
contem(html, 'Assinatura da cliente', 'campo de assinatura da cliente');
contem(html, 'Assinatura da profissional', 'campo de assinatura da profissional');
contem(html, 'aplicável', 'termo deve indicar aplicabilidade quando há foto');

/* ---------- os dois botões ---------- */

contem(html, 'data-acao="gerar-pdf"', 'botão Gerar PDF');
contem(html, 'Gerar PDF', 'rótulo do botão Gerar PDF');
contem(html, 'data-acao="reiniciar"', 'botão Reiniciar demonstração');
contem(html, 'Reiniciar demonstração', 'rótulo do botão Reiniciar demonstração');

/* ---------- documento visual, não lista de campos ---------- */

contem(html, 'class="dossie"', 'o dossiê precisa ser um documento');
contem(html, 'class="dossie-capa"', 'o dossiê precisa de capa');
conferir((html.match(/class="dossie-secao/g) || []).length >= 7,
  'o dossiê precisa das seções (desejo, diagnóstico, formato, paleta, receita, manutenção, termo).');
contem(semErro('montarTela', function () { return DOSSIE.montarTela(completo); }) || '', '<style>',
  'montarTela precisa levar o estilo do documento junto do HTML.');

/* ---------- caminho de borda: estado vazio ---------- */

var vazio = semErro('montarDossie(null)', function () { return DOSSIE.montarDossie(null); });
if (typeof vazio !== 'string') {
  falhar('montarDossie(null) deveria devolver string; veio ' + typeof vazio + '.');
  vazio = '';
}
contem(vazio, 'Cliente não identificada', 'estado vazio: capa sem cliente');
contem(vazio, 'Data não registrada', 'estado vazio: capa sem data');
contem(vazio, 'Desejo não registrado', 'estado vazio: desejo');
contem(vazio, 'Receita técnica não registrada', 'estado vazio: receita');
contem(vazio, 'Plano de manutenção não registrado', 'estado vazio: manutenção');
contem(vazio, 'Não aplicável', 'estado vazio: termo LGPD sem foto');
contem(vazio, 'Lei nº 13.709/2018', 'estado vazio: a cláusula LGPD continua no documento');
contem(vazio, 'data-acao="gerar-pdf"', 'estado vazio: botão Gerar PDF');
contem(vazio, 'data-acao="reiniciar"', 'estado vazio: botão Reiniciar');
naoContem(vazio, 'undefined', 'estado vazio não pode vazar undefined');
naoContem(vazio, 'Invalid Date', 'estado vazio não pode vazar Invalid Date');
naoContem(vazio, 'NaN', 'estado vazio não pode vazar NaN');

/* ---------- borda: termo sem foto ---------- */

var semFoto = semErro('montarDossie(sem foto)', function () {
  var copia = JSON.parse(JSON.stringify(completo));
  copia.fotoRegistrada = false;
  return DOSSIE.montarDossie(copia);
}) || '';
contem(semFoto, 'Não aplicável nesta consultoria', 'sem foto registrada o termo é não aplicável');
contem(semFoto, 'Lei nº 13.709/2018', 'sem foto a cláusula LGPD continua presente (RN-27)');
naoContem(semFoto, 'a autorização abaixo é aplicável', 'sem foto o termo não pode se declarar aplicável');

/* ---------- borda: data inválida, família desconhecida e teto derivado ---------- */

var bordas = semErro('montarDossie(bordas)', function () {
  return DOSSIE.montarDossie({
    cliente: { nome: 'Teste', contato: '' },
    dataAtendimento: 'ontem',
    familia: 'ZZ',
    baseNatural: 8,
    teto: null,
    contraste: 'alto',
    formatoRosto: 'inexistente',
    rota: 'rota-que-nao-existe'
  });
}) || '';
contem(bordas, 'Data não registrada', 'data fora do padrão ISO não vira Invalid Date');
contem(bordas, 'Intensa', 'calibração derivada de contraste alto quando não registrada');
contem(bordas, 'Formato de rosto não registrado', 'formato desconhecido degrada com mensagem');
contem(bordas, 'Paleta de vestuário indisponível', 'família desconhecida degrada com mensagem');
naoContem(bordas, 'Invalid Date', 'borda não pode vazar Invalid Date');
naoContem(bordas, 'undefined', 'borda não pode vazar undefined');

var tetoDerivado = semErro('montarDossie(teto derivado)', function () {
  var copia = JSON.parse(JSON.stringify(completo));
  delete copia.teto;
  return DOSSIE.montarDossie(copia);
}) || '';
contem(tetoDerivado, 'até 10', 'sem teto registrado, calcula o teto a partir da base natural e da família');

/* ---------- segurança: conteúdo escapado ---------- */

var hostil = semErro('montarDossie(conteúdo hostil)', function () {
  return DOSSIE.montarDossie({
    cliente: { nome: '<script>alert(1)</script>', contato: '" onmouseover="x' },
    desejo: '<img src=x onerror=alert(1)>',
    receita: '</article><script>alert(2)</script>'
  });
}) || '';
naoContem(hostil, '<script>', 'nome da cliente precisa ser escapado');
naoContem(hostil, '<img src=x', 'desejo precisa ser escapado');
contem(hostil, '&lt;script&gt;', 'escape precisa preservar o texto visível');

/* ---------- render: liga os botões e não engole erro ---------- */

var ouvintes = {};
var statusTexto = '';
var elFalso = {
  innerHTML: '',
  querySelector: function (seletor) {
    if (seletor === '[data-papel="status-dossie"]') {
      return {
        set textContent(v) { statusTexto = v; },
        get textContent() { return statusTexto; },
        setAttribute: function () {}
      };
    }
    if (!ouvintes[seletor]) {
      ouvintes[seletor] = { addEventListener: function (evento, fn) { ouvintes[seletor].fn = fn; } };
    }
    return ouvintes[seletor];
  }
};

semErro('render(el, ctx)', function () { DOSSIE.render(elFalso, { estado: completo }); });
conferir(elFalso.innerHTML.indexOf('class="dossie"') !== -1, 'render precisa desenhar o dossiê no elemento.');
conferir(!!(ouvintes['[data-acao="gerar-pdf"]'] && ouvintes['[data-acao="gerar-pdf"]'].fn),
  'render precisa ligar o botão Gerar PDF.');
conferir(!!(ouvintes['[data-acao="reiniciar"]'] && ouvintes['[data-acao="reiniciar"]'].fn),
  'render precisa ligar o botão Reiniciar demonstração.');

semErro('clique em Gerar PDF sem window.print', function () {
  ouvintes['[data-acao="gerar-pdf"]'].fn();
});
conferir(statusTexto.indexOf('impressão') !== -1,
  'sem window.print o botão precisa avisar em vez de falhar em silêncio; veio ' + JSON.stringify(statusTexto) + '.');

statusTexto = '';
semErro('clique em Reiniciar sem VISAGE/localStorage', function () {
  ouvintes['[data-acao="reiniciar"]'].fn();
});
conferir(statusTexto.length > 0, 'sem VISAGE e sem localStorage o reinício precisa avisar em vez de falhar em silêncio.');

/* ---------- impressão: interface escondida, dossiê impresso ---------- */

var css = '';
try {
  css = fs.readFileSync(path.join(__dirname, '..', 'assets', 'styles.css'), 'utf8');
} catch (err) {
  falhar('não foi possível ler assets/styles.css — ' + err.message);
}
conferir(css.indexOf('@media print') !== -1, 'styles.css precisa do bloco @media print.');
conferir(css.indexOf('.dossie-acoes') !== -1 && css.indexOf('.topo') !== -1,
  '@media print precisa esconder a interface do app (topo, rodapé e ações).');
conferir(css.indexOf('.dossie') !== -1, '@media print precisa tratar o documento do dossiê.');

/* ---------- resultado ---------- */

if (falhas.length) {
  console.error('TELA 17: ' + falhas.length + ' falha(s)');
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
} else {
  console.log('TELA 17: ok — documento visual com capa, diagnóstico, formato, paleta, receita, manutenção e termo LGPD; botões de PDF e reinício ligados.');
}
