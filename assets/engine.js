/* Motor do protótipo v2: funções puras, sem DOM.
   Regra de contraste da Ilda (spec v2, seção 2.2), implementada como está. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./data.js'));
  } else {
    root.VISAGE_ENGINE = factory(root.VISAGE_DATA);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (dados) {
  'use strict';

  var ALTURAS = dados.ALTURAS;
  var ROTULO_PROFUNDIDADE = { 1: 'clara', 2: 'média', 3: 'profunda' };
  var PALAVRA_DISTANCIA = { 0: 'pequena', 1: 'pequena', 2: 'média', 3: 'grande' };
  var ROTULO_NIVEL = { baixo: 'BAIXO', medio: 'MÉDIO', alto: 'ALTO' };

  function normalizar(valor) {
    if (typeof valor !== 'string') return '';
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  }

  function indiceProfundidade(profundidade) {
    var p = normalizar(profundidade);
    if (p === 'clara') return 1;
    if (p === 'media') return 2;
    if (p === 'profunda') return 3;
    return null;
  }

  function indiceBase(altura) {
    var n = Number(altura);
    if (!Number.isInteger(n)) return null;
    if (n >= 1 && n <= 4) return 1;
    if (n >= 5 && n <= 7) return 2;
    if (n >= 8 && n <= 10) return 3;
    return null;
  }

  function contraste(profundidade, altura) {
    var indicePele = indiceProfundidade(profundidade);
    var base = Number(altura);
    if (!indicePele) {
      throw new Error('Profundidade inválida: "' + profundidade + '". Use clara, média ou profunda.');
    }
    if (!Number.isInteger(base) || ALTURAS.indexOf(base) === -1) {
      throw new Error('Altura de base inválida: "' + altura + '". Alturas válidas: ' + ALTURAS.join(', ') + ' (a altura 02 não existe no mercado).');
    }
    var indiceCabelo = indiceBase(base);
    var distancia = Math.abs(indicePele - indiceCabelo);
    var nivel = distancia <= 1 ? 'baixo' : (distancia === 2 ? 'medio' : 'alto');
    var texto = 'Sua pele é ' + ROTULO_PROFUNDIDADE[indicePele] +
      ' e seu cabelo é base ' + dados.formatarAltura(altura) +
      '. A distância entre eles é ' + PALAVRA_DISTANCIA[distancia] +
      ' → contraste ' + ROTULO_NIVEL[nivel] + '.';
    return {
      indicePele: indicePele,
      indiceBase: indiceCabelo,
      distancia: distancia,
      nivel: nivel,
      texto: texto
    };
  }

  function resolverFamilia(familia) {
    if (familia && typeof familia === 'object' && Array.isArray(familia.amostras)) return familia;
    return dados.familiaPorSigla(familia);
  }

  /* O teto é contado em degraus na régua de alturas (a altura 02 não existe). */
  function tetoDeClareamento(baseNatural, degraus) {
    var base = Number(baseNatural);
    var indice = ALTURAS.indexOf(base);
    if (indice === -1) return null;
    var passos = Number(degraus);
    if (!Number.isFinite(passos) || passos < 0) passos = 4;
    return ALTURAS[Math.min(indice + Math.floor(passos), ALTURAS.length - 1)];
  }

  function amostrasViaveis(familia, teto) {
    var f = resolverFamilia(familia);
    var limite = Number(teto);
    if (!f || !Number.isFinite(limite)) return [];
    return f.amostras.filter(function (amostra) {
      return amostra.altura <= limite;
    });
  }

  function rotaDaTela11(familia, teto) {
    return amostrasViaveis(familia, teto).length > 0 ? 13 : 12;
  }

  function texto(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
  }

  function formatoValido(id) {
    return !!dados.formatoPorId(id);
  }

  /* Ordem única dos cinco campos da tela 9 (spec v2, seção TELA 9). */
  var CAMPOS_FORMATO = [
    { campo: 'corte', rotulo: 'Corte' },
    { campo: 'franja', rotulo: 'Franja' },
    { campo: 'reparticao', rotulo: 'Repartição' },
    { campo: 'volume', rotulo: 'Volume' },
    { campo: 'posicaoCor', rotulo: 'Posição da cor' }
  ];

  function resolverFormato(formato) {
    if (typeof formato === 'string') {
      var encontrado = dados.formatoPorId(formato);
      if (encontrado) return encontrado;
      throw new Error('Formato de rosto desconhecido: "' + formato + '".');
    }
    if (formato && typeof formato === 'object') return formato;
    throw new Error('itensDoFormato espera o formato do rosto ou o id de um dos oito formatos.');
  }

  /* A tabela da spec traz uma frase por formato, não cinco campos:
     a tela 9 exibe só os itens que a frase realmente separa. */
  function itensDoFormato(formato) {
    var f = resolverFormato(formato);
    var vistos = [];
    var itens = [];
    CAMPOS_FORMATO.forEach(function (def) {
      var t = texto(f[def.campo]);
      if (!t) return;
      var chave = normalizar(t);
      if (vistos.indexOf(chave) !== -1) return;
      vistos.push(chave);
      itens.push({ campo: def.campo, rotulo: def.rotulo, texto: t });
    });
    return itens;
  }

  function alturaDeMercado(altura) {
    var n = Number(altura);
    return Number.isInteger(n) && ALTURAS.indexOf(n) !== -1;
  }

  function validaEtapa(estado, numeroDaTela) {
    var e = estado || {};
    var n = Number(numeroDaTela);

    switch (n) {
      case 1:
        if (!e.cliente || !texto(e.cliente.nome) || !texto(e.cliente.contato)) {
          return { ok: false, motivo: 'Informe o nome e o contato da cliente para abrir o prontuário.' };
        }
        return { ok: true, motivo: '' };
      case 2:
        return { ok: true, motivo: '' };
      case 3:
        if (['harmonia', 'iris', 'estilo'].indexOf(e.rota) === -1) {
          return { ok: false, motivo: 'Escolha a rota: Harmonia, Íris ou Estilo.' };
        }
        return { ok: true, motivo: '' };
      case 4:
        if (!indiceProfundidade(e.profundidade)) {
          return { ok: false, motivo: 'Registre a profundidade da pele: Clara, Média ou Profunda.' };
        }
        return { ok: true, motivo: '' };
      case 5:
        if (!alturaDeMercado(e.baseNatural)) {
          return { ok: false, motivo: 'Escolha a altura da base natural (01, 03 a 10).' };
        }
        return { ok: true, motivo: '' };
      case 6:
        if (indiceProfundidade(e.profundidade) === null || !alturaDeMercado(e.baseNatural)) {
          return { ok: false, motivo: 'Faltam a profundidade da pele e a base natural para calcular o contraste.' };
        }
        if (e.contrasteAjuste && !texto(e.contrasteAjuste.justificativa)) {
          return { ok: false, motivo: 'O ajuste manual do contraste exige justificativa.' };
        }
        if (['baixo', 'medio', 'alto'].indexOf(e.contraste) === -1) {
          return { ok: false, motivo: 'Confirme o contraste calculado ou ajuste manualmente com justificativa.' };
        }
        return { ok: true, motivo: '' };
      case 7:
        if (['comporta', 'comprometido', 'sem'].indexOf(e.saudeFio) === -1) {
          return { ok: false, motivo: 'Avalie a saúde do fio antes de seguir.' };
        }
        if (e.saudeFio === 'sem') {
          return {
            ok: false,
            motivo: 'RN-22: fio sem condição para receber cor bloqueia a prescrição. O fluxo desvia para orientação de tratamento.',
            bloqueio: 'tratamento'
          };
        }
        return { ok: true, motivo: '' };
      case 8:
        if (!formatoValido(e.formatoRosto)) {
          return { ok: false, motivo: 'Escolha uma das oito formas de rosto.' };
        }
        return { ok: true, motivo: '' };
      case 9:
        if (!formatoValido(e.formatoRosto)) {
          return { ok: false, motivo: 'A tela 9 depende do formato escolhido na tela 8.' };
        }
        return { ok: true, motivo: '' };
      default:
        /* Telas 10 a 17 ainda não têm render registrado: a navegação segue
           livre e o roteador desenha o cartão "em construção" no lugar. */
        if (n >= 10 && n <= 17) {
          return { ok: true, motivo: '' };
        }
        return { ok: false, motivo: 'Tela inválida: ' + numeroDaTela + '.' };
    }
  }

  return {
    indiceProfundidade: indiceProfundidade,
    indiceBase: indiceBase,
    alturaDeMercado: alturaDeMercado,
    contraste: contraste,
    tetoDeClareamento: tetoDeClareamento,
    amostrasViaveis: amostrasViaveis,
    rotaDaTela11: rotaDaTela11,
    itensDoFormato: itensDoFormato,
    validaEtapa: validaEtapa
  };
});
