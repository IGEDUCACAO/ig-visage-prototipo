/* Ilustracoes de corte — traco de linha, sem foto (pedido do Alysson).
   Cada silhueta e um desenho de massa de cabelo em viewBox 0 0 100 130.
   O mapa CORTES_POR_FORMATO diz quais cortes combinam com cada formato de
   rosto e com a estatura da cliente. */
(function (global) {
  'use strict';

  var VISAGE = global.VISAGE = global.VISAGE || {};

  var ROSTO = 'M50 30 C61 30 68 39 68 51 C68 63 60 74 50 78 C40 74 32 63 32 51 C32 39 39 30 50 30 Z';

  var SILHUETAS = {
    'longo-liso': {
      nome: 'Longo liso',
      path: ROSTO +
        ' M30 44 C26 66 27 96 30 122 L42 118 C38 96 37 68 38 48' +
        ' M70 44 C74 66 73 96 70 122 L58 118 C62 96 63 68 62 48'
    },
    'longo-camadas': {
      nome: 'Longo em camadas',
      path: ROSTO +
        ' M30 42 C24 60 26 82 22 100 C28 96 30 92 32 86 C30 100 34 110 36 118' +
        ' M70 42 C76 60 74 82 78 100 C72 96 70 92 68 86 C70 100 66 110 64 118'
    },
    'chanel': {
      nome: 'Chanel',
      path: ROSTO +
        ' M26 40 C22 56 24 70 26 82 L74 82 C76 70 78 56 74 40 C70 30 61 24 50 24 C39 24 30 30 26 40 Z' +
        ' M26 46 L74 46'
    },
    'bob': {
      nome: 'Bob',
      path: ROSTO +
        ' M27 42 C24 54 25 64 27 72 L73 72 C75 64 76 54 73 42 C69 32 60 25 50 25 C40 25 31 32 27 42 Z'
    },
    'pixie': {
      nome: 'Pixie',
      path: ROSTO +
        ' M30 40 C30 28 40 22 50 22 C60 22 70 28 70 40 C70 44 66 42 62 40 C56 36 44 36 38 40 C34 43 30 45 30 40 Z'
    },
    'medio-ondulado': {
      nome: 'Médio ondulado',
      path: ROSTO +
        ' M28 42 C22 50 26 58 22 64 C28 66 30 62 32 58 C30 70 34 76 32 84' +
        ' M72 42 C78 50 74 58 78 64 C72 66 70 62 68 58 C70 70 66 76 68 84'
    },
    'franja-cortina': {
      nome: 'Franja cortina',
      path: ROSTO +
        ' M30 40 C30 26 40 20 50 20 C60 20 70 26 70 40' +
        ' M50 22 C46 32 40 36 34 40 C40 44 46 42 50 36 C54 42 60 44 66 40 C60 36 54 32 50 22 Z'
    },
    'coque-alto': {
      nome: 'Coque alto',
      path: ROSTO +
        ' M34 40 C34 26 42 20 50 20 C58 20 66 26 66 40' +
        ' M50 20 C50 10 56 6 60 8 C66 10 66 18 60 20 C56 21 52 21 50 20 Z'
    }
  };

  /* formato -> estatura -> cortes indicados (ids de SILHUETAS) */
  var CORTES_POR_FORMATO = {
    oval:        { baixa: ['longo-camadas', 'chanel', 'franja-cortina'], media: ['longo-liso', 'bob', 'medio-ondulado'], alta: ['pixie', 'bob', 'medio-ondulado'] },
    redondo:     { baixa: ['longo-liso', 'longo-camadas', 'medio-ondulado'], media: ['longo-liso', 'longo-camadas', 'chanel'], alta: ['longo-camadas', 'pixie', 'medio-ondulado'] },
    quadrado:    { baixa: ['medio-ondulado', 'chanel', 'franja-cortina'], media: ['medio-ondulado', 'longo-camadas', 'bob'], alta: ['chanel', 'medio-ondulado', 'longo-camadas'] },
    retangular:  { baixa: ['bob', 'chanel', 'franja-cortina'], media: ['bob', 'medio-ondulado', 'franja-cortina'], alta: ['longo-camadas', 'medio-ondulado', 'franja-cortina'] },
    'triangulo-invertido': { baixa: ['chanel', 'bob', 'medio-ondulado'], media: ['chanel', 'franja-cortina', 'bob'], alta: ['franja-cortina', 'medio-ondulado', 'longo-camadas'] },
    triangular:  { baixa: ['longo-camadas', 'chanel', 'franja-cortina'], media: ['longo-camadas', 'medio-ondulado', 'franja-cortina'], alta: ['chanel', 'pixie', 'franja-cortina'] },
    losangular:  { baixa: ['medio-ondulado', 'chanel', 'longo-camadas'], media: ['medio-ondulado', 'franja-cortina', 'chanel'], alta: ['bob', 'medio-ondulado', 'franja-cortina'] },
    hexagonal:   { baixa: ['chanel', 'longo-camadas', 'bob'], media: ['chanel', 'medio-ondulado', 'bob'], alta: ['pixie', 'bob', 'medio-ondulado'] }
  };

  var ESTATURAS = [
    { id: 'baixa', titulo: 'Baixa', sub: 'até 1,60 m' },
    { id: 'media', titulo: 'Média', sub: '1,60 a 1,70 m' },
    { id: 'alta', titulo: 'Alta', sub: 'acima de 1,70 m' }
  ];

  function svgDoCorte(id, classe) {
    var s = SILHUETAS[id];
    if (!s) return '';
    return '<svg class="' + (classe || 'ilustracao-corte') + '" viewBox="0 0 100 130" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="' + s.path + '"/></svg>';
  }

  function cortesDoFormato(formatoId, estatura) {
    var mapa = CORTES_POR_FORMATO[formatoId];
    if (!mapa) return [];
    var lista = mapa[estatura] || mapa.media || [];
    return lista.map(function (id) {
      return { id: id, nome: (SILHUETAS[id] || {}).nome || id, svg: svgDoCorte(id) };
    });
  }

  VISAGE.ilustracoesCorte = {
    SILHUETAS: SILHUETAS,
    ESTATURAS: ESTATURAS,
    CORTES_POR_FORMATO: CORTES_POR_FORMATO,
    svgDoCorte: svgDoCorte,
    cortesDoFormato: cortesDoFormato
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = VISAGE.ilustracoesCorte;
})(typeof window !== 'undefined' ? window : globalThis);
