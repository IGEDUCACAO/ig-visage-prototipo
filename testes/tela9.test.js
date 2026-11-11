/* Teste da tela 9 — node puro, sem framework e sem npm.
   Uso: node testes/tela9.test.js
   Sai com código != 0 se a tabela, o motor ou a derivação dos itens quebrarem. */
'use strict';

var DADOS = require('../assets/data.js');
var MOTOR = require('../assets/engine.js');

var ORDEM = ['corte', 'franja', 'reparticao', 'volume', 'posicaoCor'];
var ROTULOS = {
  corte: 'Corte',
  franja: 'Franja',
  reparticao: 'Repartição',
  volume: 'Volume',
  posicaoCor: 'Posição da cor'
};

var falhas = [];

function falhar(mensagem) {
  falhas.push(mensagem);
}

function normalizar(valor) {
  return String(valor == null ? '' : valor)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase();
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

/* ---------- tabela ---------- */

conferir(Array.isArray(DADOS.FORMATOS_ROSTO), 'FORMATOS_ROSTO precisa ser array.');
conferir(DADOS.FORMATOS_ROSTO.length === 8, 'A tabela precisa das oito formas de rosto; veio ' + DADOS.FORMATOS_ROSTO.length + '.');

var ids = {};
DADOS.FORMATOS_ROSTO.forEach(function (formato) {
  var id = formato && formato.id;
  conferir(typeof id === 'string' && id.length > 0, 'Formato sem id: ' + JSON.stringify(formato && formato.nome));
  conferir(!ids[id], 'id de formato repetido: ' + id);
  ids[id] = true;

  var direcionamento = typeof formato.direcionamento === 'string' ? formato.direcionamento.trim() : '';
  conferir(direcionamento.length > 0, '[' + id + '] formato sem direcionamento.');

  var itens = MOTOR.itensDoFormato(formato);
  conferir(Array.isArray(itens), '[' + id + '] itensDoFormato não devolveu array.');

  var vistos = {};
  var ultimoIndice = -1;

  itens.forEach(function (item, posicao) {
    var etiqueta = '[' + id + '] item ' + (posicao + 1);

    if (!item || typeof item !== 'object') {
      falhar(etiqueta + ': não é objeto.');
      return;
    }

    if (typeof item.campo !== 'string' || item.campo.length === 0) {
      falhar(etiqueta + ': veio sem campo.');
    } else if (ORDEM.indexOf(item.campo) === -1) {
      falhar(etiqueta + ': campo fora da tabela: ' + item.campo);
    }

    if (typeof item.rotulo !== 'string' || item.rotulo.trim().length === 0) {
      falhar(etiqueta + ': veio sem rótulo.');
    } else if (ROTULOS[item.campo] && item.rotulo !== ROTULOS[item.campo]) {
      falhar(etiqueta + ': rótulo "' + item.rotulo + '" não corresponde ao campo "' + item.campo + '".');
    }

    var texto = typeof item.texto === 'string' ? item.texto.trim() : '';
    if (texto.length === 0) {
      falhar(etiqueta + ': veio sem texto.');
      return;
    }

    var chave = normalizar(texto);
    if (vistos[chave]) {
      falhar('[' + id + '] texto repetido entre campos (' + vistos[chave] + ' e ' + item.campo + '): "' + texto + '".');
    }
    vistos[chave] = item.campo;

    if (normalizar(texto) === normalizar(direcionamento)) {
      falhar('[' + id + '] o item "' + item.campo + '" repete a frase inteira do direcionamento.');
    }

    if (direcionamento && normalizar(direcionamento).indexOf(chave) === -1) {
      falhar('[' + id + '] o item "' + item.campo + '" não é trecho da tabela: "' + texto + '".');
    }

    var indice = ORDEM.indexOf(item.campo);
    if (indice !== -1 && indice < ultimoIndice) {
      falhar('[' + id + '] item "' + item.campo + '" fora da ordem corte → franja → repartição → volume → posição da cor.');
    }
    ultimoIndice = indice === -1 ? ultimoIndice : indice;
  });
});

/* ---------- casos concretos da spec ---------- */

var losangular = DADOS.formatoPorId('losangular');
if (!losangular) {
  falhar('formato losangular não existe na tabela.');
} else {
  var itensLosangular = MOTOR.itensDoFormato(losangular);
  conferir(itensLosangular.length < 4, 'losangular devolveu ' + itensLosangular.length + ' itens (precisa ser menos de 4).');
}

var redondo = DADOS.formatoPorId('redondo');
if (!redondo) {
  falhar('formato redondo não existe na tabela.');
} else {
  var itensRedondo = MOTOR.itensDoFormato(redondo);
  var volume = null;
  var posicaoCor = null;
  itensRedondo.forEach(function (item) {
    if (item.campo === 'volume') volume = item.texto;
    if (item.campo === 'posicaoCor') posicaoCor = item.texto;
  });
  conferir(volume === 'Volume no topo', '[redondo] volume deveria ser "Volume no topo"; veio ' + JSON.stringify(volume) + '.');
  conferir(posicaoCor === 'Luz que cria altura', '[redondo] posicaoCor deveria ser "Luz que cria altura"; veio ' + JSON.stringify(posicaoCor) + '.');
}

var oval = DADOS.formatoPorId('oval');
if (!oval) {
  falhar('formato oval não existe na tabela.');
} else {
  conferir(MOTOR.itensDoFormato(oval).length === 0,
    '[oval] a tabela não separa nenhum campo; itensDoFormato deveria devolver lista vazia (a tela mostra a linha única).');
}

/* ---------- aceita id ou objeto, e nunca muta a tabela ---------- */

var antes = JSON.stringify(redondo);
var porId = MOTOR.itensDoFormato('redondo');
conferir(JSON.stringify(porId) === JSON.stringify(itensRedondo || []), 'itensDoFormato(id) e itensDoFormato(formato) divergem.');
conferir(JSON.stringify(redondo) === antes, 'itensDoFormato alterou o objeto do formato.');

/* ---------- descarta vazio e duplicata ---------- */

var sintetico = MOTOR.itensDoFormato({
  id: 'sintetico',
  direcionamento: 'volume no topo',
  corte: null,
  franja: '   ',
  reparticao: null,
  volume: 'Volume no topo',
  posicaoCor: 'VOLUME NO TOPO'
});
conferir(sintetico.length === 1 && sintetico[0].campo === 'volume',
  'itensDoFormato deveria descartar vazios e repetir texto só uma vez; veio ' + JSON.stringify(sintetico) + '.');

/* ---------- caminhos de erro ---------- */

esperaErro('itensDoFormato("losango")', function () { MOTOR.itensDoFormato('losango'); }, 'losango');
esperaErro('itensDoFormato(null)', function () { MOTOR.itensDoFormato(null); }, 'itensDoFormato');
esperaErro('itensDoFormato(42)', function () { MOTOR.itensDoFormato(42); }, 'itensDoFormato');

/* ---------- resultado ---------- */

if (falhas.length) {
  console.error('TELA 9: ' + falhas.length + ' falha(s)');
  falhas.forEach(function (mensagem) { console.error('  - ' + mensagem); });
  process.exitCode = 1;
} else {
  console.log('TELA 9: ok — ' + DADOS.FORMATOS_ROSTO.length + ' formatos, direcionamento único, itens sem repetição e sem invenção.');
}
