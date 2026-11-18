/* Ilustrações de corte — desenhadas de FRENTE.
   O desenho é um rosto visto de frente (olhos, nariz, boca, ombros), com a
   massa de cabelo do corte por cima. Nada de perfil: a cliente precisa se
   reconhecer na sugestão de corte. */
(function (global) {
  'use strict';

  var VISAGE = global.VISAGE = global.VISAGE || {};

  var ROSTO = 'M50 28 C60.5 28 67 37 67 48.5 C67 59 62.5 68 56.5 73 C54 75.5 52 76.5 50 76.5 C48 76.5 46 75.5 43.5 73 C37.5 68 33 59 33 48.5 C33 37 39.5 28 50 28 Z';

  /* Pescoço, ombros e traços do rosto — iguais para todos os cortes. */
  var CORPO =
    ' M43 74 C43 79 43 82 43 85 M57 74 C57 79 57 82 57 85' +
    ' M18 130 C19 111 32 99 50 99 C68 99 81 111 82 130';
  var TRACOS =
    ' M39.5 44.5 C42 43 45 43 47 44.5' +
    ' M53 44.5 C55 43 58 43 60.5 44.5' +
    ' M40.5 50.5 C42.6 47.6 45.4 47.6 47.5 50.5 C45.4 53.2 42.6 53.2 40.5 50.5 Z' +
    ' M52.5 50.5 C54.6 47.6 57.4 47.6 59.5 50.5 C57.4 53.2 54.6 53.2 52.5 50.5 Z' +
    ' M50 55 C50 58 50 59.5 50 60.5 M47 62.4 C49 63.6 51 63.6 53 62.4' +
    ' M45.5 67 C48.5 69.2 51.5 69.2 54.5 67';

  var SILHUETAS = {
    'longo-liso': {
      nome: 'Longo liso',
      path: ROSTO +
        ' M50 20 C36 20 26 31 26 47 C24 66 24 92 26 124 L40 124 C37 100 36.5 74 37.5 54 C38 42 43 34 50 34 C57 34 62 42 62.5 54 C63.5 74 63 100 60 124 L74 124 C76 92 76 66 74 47 C74 31 64 20 50 20 Z' +
        ' M50 21.5 L50 32'
    },
    'longo-camadas': {
      nome: 'Longo em camadas',
      path: ROSTO +
        ' M50 20 C35 20 25 32 25 48 C23 64 27 84 23 104 C29 100 31 96 33 90 C31 104 35 116 37 122 L44 118 C40 104 38 88 39 70 C39.5 52 42 36 50 34 C58 36 60.5 52 61 70 C62 88 60 104 56 118 L63 122 C65 116 69 104 67 90 C69 96 71 100 77 104 C73 84 77 64 75 48 C75 32 65 20 50 20 Z' +
        ' M39 60 C37.5 78 37 96 39 112 M61 60 C62.5 78 63 96 61 112'
    },
    'chanel': {
      nome: 'Chanel',
      path: ROSTO +
        ' M50 20 C36 20 27 31 27 46 C26 60 27 72 28 82 L72 82 C73 72 74 60 73 46 C73 31 64 20 50 20 Z' +
        ' M28 77.5 C36 79.5 44 80 50 80 C56 80 64 79.5 72 77.5'
    },
    'bob': {
      nome: 'Long bob',
      path: ROSTO +
        ' M50 20 C35 20 26 32 26 48 C25 64 26 78 27 92 L73 92 C74 78 75 64 74 48 C74 32 65 20 50 20 Z' +
        ' M27 87 C36 89.5 44 90 50 90 C56 90 64 89.5 73 87'
    },
    'pixie': {
      nome: 'Pixie',
      path: ROSTO +
        ' M50 21 C38 21 30 29 30 41 C30 45 31 48 32 50 C31 44 33 36 39 33 C45 30 55 30 61 33 C67 36 69 44 68 50 C69 48 70 45 70 41 C70 29 62 21 50 21 Z' +
        ' M61 31 C65.5 34 67.5 39 67.5 43'
    },
    'medio-ondulado': {
      nome: 'Médio ondulado',
      path: ROSTO +
        ' M50 20 C35 20 25 32 25 48 C23 62 27 70 24 80 C30 78 33 74 34 68 C33 80 36 88 34 96 L44 92 C39 84 38 72 39 60 C39.5 48 42 36 50 34 C58 36 60.5 48 61 60 C62 72 61 84 56 92 L66 96 C64 88 67 80 66 68 C67 74 70 78 76 80 C73 70 77 62 75 48 C75 32 65 20 50 20 Z' +
        ' M31 56 C33 62 31 68 33 74 M69 56 C67 62 69 68 67 74'
    },
    'franja-cortina': {
      nome: 'Franja cortina',
      path: ROSTO +
        ' M50 20 C36 20 26 31 26 47 C24 66 24 92 26 124 L40 124 C37 100 36.5 74 37.5 54 C38 42 43 34 50 34 C57 34 62 42 62.5 54 C63.5 74 63 100 60 124 L74 124 C76 92 76 66 74 47 C74 31 64 20 50 20 Z' +
        ' M50 22 C46 30 40 34 33 37 C38 41 45 39 48.5 32 Z' +
        ' M50 22 C54 30 60 34 67 37 C62 41 55 39 51.5 32 Z'
    },
    'coque-alto': {
      nome: 'Coque alto',
      path: ROSTO +
        ' M50 22 C39 22 32 30 32 41 C32 45 33 48 34 50 C33 44 35 37 41 34 C47 31 53 31 59 34 C65 37 67 44 66 50 C67 48 68 45 68 41 C68 30 61 22 50 22 Z' +
        ' M50 21 C47 9 56 3 62 6 C69 10 68 20 60 21.5'
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
    return '<svg class="' + (classe || 'ilustracao-corte') + '" viewBox="0 0 100 130" aria-hidden="true" focusable="false">' +
      '<g class="ilustracao-corpo" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".45">' +
        '<path d="' + CORPO + '"/>' +
        '<path d="' + TRACOS + '"/>' +
      '</g>' +
      '<path class="ilustracao-cabelo" d="' + s.path + '" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  /* A ilustração agora é sempre o desenho de frente; o PNG antigo (de perfil)
     saiu do app — a cliente precisa ver o rosto dela encarando a tela. */
  function figuraDoCorte(id, classe) {
    var s = SILHUETAS[id];
    if (!s) return '';
    return svgDoCorte(id, classe);
  }

  function cortesDoFormato(formatoId, estatura) {
    var mapa = CORTES_POR_FORMATO[formatoId];
    if (!mapa) return [];
    var lista = mapa[estatura] || mapa.media || [];
    return lista.map(function (id) {
      return { id: id, nome: (SILHUETAS[id] || {}).nome || id, svg: figuraDoCorte(id) };
    });
  }

  VISAGE.ilustracoesCorte = {
    SILHUETAS: SILHUETAS,
    ESTATURAS: ESTATURAS,
    CORTES_POR_FORMATO: CORTES_POR_FORMATO,
    svgDoCorte: svgDoCorte,
    figuraDoCorte: figuraDoCorte,
    cortesDoFormato: cortesDoFormato
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = VISAGE.ilustracoesCorte;
})(typeof window !== 'undefined' ? window : globalThis);
