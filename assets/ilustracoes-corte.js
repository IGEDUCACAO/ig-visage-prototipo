/* Ilustrações de corte — croquis de frente.
   As imagens são os desenhos (line art) em assets/cortes/*.png, todos com o
   rosto de frente. O PNG é a fonte da verdade: nada de SVG geométrico, que
   ficava com cara de ícone e não de croqui. */
(function (global) {
  'use strict';

  var VISAGE = global.VISAGE = global.VISAGE || {};

  var SILHUETAS = {
    'longo-liso':     { nome: 'Longo liso' },
    'longo-camadas':  { nome: 'Longo em camadas' },
    'chanel':         { nome: 'Chanel' },
    'bob':            { nome: 'Long bob' },
    'pixie':          { nome: 'Pixie' },
    'medio-ondulado': { nome: 'Médio ondulado' },
    'franja-cortina': { nome: 'Franja cortina' },
    'coque-alto':     { nome: 'Coque alto' }
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

  function caminhoDoCorte(id) {
    return 'assets/cortes/' + id + '.png';
  }

  function figuraDoCorte(id, classe) {
    var s = SILHUETAS[id];
    if (!s) return '';
    return '<img class="' + (classe || 'ilustracao-corte') + '" src="' + caminhoDoCorte(id) + '"' +
      ' alt="Croqui do corte ' + s.nome + ', de frente" loading="lazy" decoding="async">';
  }

  function cortesDoFormato(formatoId, estatura) {
    var mapa = CORTES_POR_FORMATO[formatoId];
    if (!mapa) return [];
    var lista = mapa[estatura] || mapa.media || [];
    return lista.map(function (id) {
      return { id: id, nome: (SILHUETAS[id] || {}).nome || id, figura: figuraDoCorte(id) };
    });
  }

  VISAGE.ilustracoesCorte = {
    SILHUETAS: SILHUETAS,
    ESTATURAS: ESTATURAS,
    CORTES_POR_FORMATO: CORTES_POR_FORMATO,
    caminhoDoCorte: caminhoDoCorte,
    figuraDoCorte: figuraDoCorte,
    cortesDoFormato: cortesDoFormato
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = VISAGE.ilustracoesCorte;
})(typeof window !== 'undefined' ? window : globalThis);
