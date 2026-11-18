/* Dados do método Visage Harmonie — protótipo v2.
   Famílias, amostras e alturas vêm do protótipo v1 (main).
   Os hex das amostras são direção de tela, não cor de produto:
   a decisão se confirma com a amostra física na mão. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.VISAGE_DATA = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ALTURAS = [1, 3, 4, 5, 6, 7, 8, 9, 10];

  var FAMILIAS = [
    {
      sigla: 'IP',
      nome: 'Inverno Profundo',
      faixa: [1, 4],
      temperatura: 'fria',
      profundidade: 'profunda',
      tetoClareamento: 4,
      evitar: 'Dourado intenso e cobre claro',
      amostras: [
        { codigo: '01.0', nome: 'Preto Azulado', altura: 1, hex: '#141318' },
        { codigo: '03.0', nome: 'Castanho Escuro Frio', altura: 3, hex: '#2c2622' },
        { codigo: '04.0', nome: 'Castanho Médio Frio', altura: 4, hex: '#463a30' }
      ]
    },
    {
      sigla: 'OP',
      nome: 'Outono Profundo',
      faixa: [1, 4],
      temperatura: 'quente',
      profundidade: 'profunda',
      tetoClareamento: 4,
      evitar: 'Platinados e perolados claros',
      amostras: [
        { codigo: '01.0', nome: 'Preto Quente', altura: 1, hex: '#171310' },
        { codigo: '03.0', nome: 'Castanho Escuro Quente', altura: 3, hex: '#33241a' },
        { codigo: '04.0', nome: 'Castanho Médio Quente', altura: 4, hex: '#4d3320' }
      ]
    },
    {
      sigla: 'PC',
      nome: 'Primavera Clara',
      faixa: [8, 10],
      temperatura: 'quente',
      profundidade: 'clara',
      tetoClareamento: 4,
      evitar: 'Frios profundos e vermelhos escuros',
      amostras: [
        { codigo: '8.34', nome: 'Loiro Dourado Cobre', altura: 8, hex: '#d9ac6d' },
        { codigo: '8.4', nome: 'Loiro Cobre', altura: 8, hex: '#d49a5c' },
        { codigo: '8.7', nome: 'Loiro Manteiga', altura: 8, hex: '#dcc08e' },
        { codigo: '8.73', nome: 'Loiro Manteiga Dourado', altura: 8, hex: '#d8b478' },
        { codigo: '9.2', nome: 'Loiro Bege', altura: 9, hex: '#e0c79b' },
        { codigo: '9.3', nome: 'Loiro Dourado', altura: 9, hex: '#e5c37c' },
        { codigo: '10.3', nome: 'Platinado Dourado', altura: 10, hex: '#eee0bb' }
      ]
    },
    {
      sigla: 'PE',
      nome: 'Primavera Essencial',
      faixa: [6, 7],
      temperatura: 'quente',
      profundidade: 'media',
      tetoClareamento: 4,
      evitar: 'Cinza e grafite puro; platinado frio',
      amostras: [
        { codigo: '6.4', nome: 'Loiro Escuro Cobre', altura: 6, hex: '#a5703c' },
        { codigo: '6.47', nome: 'Loiro Escuro Cobre Acobreado', altura: 6, hex: '#a2632f' },
        { codigo: '6.66', nome: 'Loiro Escuro Intenso', altura: 6, hex: '#9c6a35' },
        { codigo: '6.7', nome: 'Loiro Escuro Manteiga', altura: 6, hex: '#a8783f' },
        { codigo: '7.2', nome: 'Loiro Bege', altura: 7, hex: '#c19a60' },
        { codigo: '7.4', nome: 'Loiro Cobre', altura: 7, hex: '#bc8340' },
        { codigo: '7.47', nome: 'Loiro Cobre Acobreado', altura: 7, hex: '#b37534' },
        { codigo: '7.7', nome: 'Loiro Manteiga', altura: 7, hex: '#c49a55' },
        { codigo: '7.73', nome: 'Loiro Manteiga Dourado', altura: 7, hex: '#c2924a' }
      ]
    },
    {
      sigla: 'VC',
      nome: 'Verão Claro',
      faixa: [8, 10],
      temperatura: 'fria',
      profundidade: 'clara',
      tetoClareamento: 4,
      evitar: 'Quentes profundos e saturados',
      amostras: [
        { codigo: '8.1', nome: 'Loiro Cinza', altura: 8, hex: '#cfb99c' },
        { codigo: '9.1', nome: 'Loiro Cinza Claro', altura: 9, hex: '#ddcbb4' },
        { codigo: '10.1', nome: 'Platinado Cinza', altura: 10, hex: '#e9e0d2' }
      ]
    },
    {
      sigla: 'VE',
      nome: 'Verão Essencial',
      faixa: [6, 7],
      temperatura: 'fria',
      profundidade: 'media',
      tetoClareamento: 4,
      evitar: 'Dourado intenso, acobreado e vermelho quente',
      amostras: [
        { codigo: '6.1', nome: 'Loiro Escuro Cinza', altura: 6, hex: '#96795e' },
        { codigo: '7.1', nome: 'Loiro Cinza', altura: 7, hex: '#b39a80' }
      ]
    }
  ];

  var FAMILIA_POR_SIGLA = {};
  FAMILIAS.forEach(function (f) { FAMILIA_POR_SIGLA[f.sigla] = f; });

  function familiaPorSigla(sigla) {
    if (!sigla) return null;
    return FAMILIA_POR_SIGLA[String(sigla).toUpperCase()] || null;
  }

  /* A tabela da spec (seção TELA 9) traz UMA frase por formato. Os campos
     derivados só recebem um trecho quando a própria frase separa aquela
     informação; o que a tabela não separa fica null (a tela 9 não inventa). */
  var FORMATOS_ROSTO = [
    {
      id: 'oval',
      nome: 'Oval',
      direcionamento: 'formato de referência, quase tudo favorece',
      corte: null,
      franja: null,
      reparticao: null,
      volume: null,
      posicaoCor: null
    },
    {
      id: 'redondo',
      nome: 'Redondo',
      direcionamento: 'volume no topo, luz que cria altura, evitar largura nas laterais',
      corte: 'Evitar largura nas laterais',
      franja: null,
      reparticao: null,
      volume: 'Volume no topo',
      posicaoCor: 'Luz que cria altura'
    },
    {
      id: 'quadrado',
      nome: 'Quadrado',
      direcionamento: 'ondas e linhas suaves que quebram o ângulo, evitar cortes retos na altura da mandíbula',
      corte: 'Evitar cortes retos na altura da mandíbula',
      franja: null,
      reparticao: null,
      volume: null,
      posicaoCor: null
    },
    {
      id: 'retangular',
      nome: 'Retangular',
      direcionamento: 'franja e volume lateral para encurtar visualmente, evitar comprimento excessivo sem volume',
      corte: 'Evitar comprimento excessivo sem volume',
      franja: 'Franja e volume lateral para encurtar visualmente',
      reparticao: null,
      volume: 'Volume lateral',
      posicaoCor: null
    },
    {
      id: 'triangular',
      nome: 'Triangular',
      direcionamento: 'volume e luz na parte superior, evitar peso na mandíbula',
      corte: 'Evitar peso na mandíbula',
      franja: null,
      reparticao: null,
      volume: 'Volume e luz na parte superior',
      posicaoCor: 'Luz na parte superior'
    },
    {
      id: 'triangulo-invertido',
      nome: 'Triângulo invertido',
      direcionamento: 'volume na altura da mandíbula e do queixo, evitar volume no topo',
      corte: null,
      franja: null,
      reparticao: null,
      volume: 'Volume na altura da mandíbula e do queixo',
      posicaoCor: null
    },
    {
      id: 'losangular',
      nome: 'Losangular',
      direcionamento: 'suavizar as maçãs com mechas que acolhem o rosto, evitar cortes que exponham os ângulos',
      corte: 'Evitar cortes que exponham os ângulos',
      franja: 'Mechas que acolhem o rosto',
      reparticao: null,
      volume: null,
      posicaoCor: null
    },
    {
      id: 'hexagonal',
      nome: 'Hexagonal',
      direcionamento: 'contornos suaves e mechas que acolhem, evitar linhas muito retas',
      corte: 'Evitar linhas muito retas',
      franja: 'Mechas que acolhem',
      reparticao: null,
      volume: null,
      posicaoCor: null
    }
  ];

  function formatoPorId(id) {
    if (!id) return null;
    for (var i = 0; i < FORMATOS_ROSTO.length; i++) {
      if (FORMATOS_ROSTO[i].id === id) return FORMATOS_ROSTO[i];
    }
    return null;
  }

  var CAMADAS = [
    {
      id: 'neutros',
      nome: 'Neutros',
      criterioContraste: 'serve a todos os contrastes',
      rotuloTela16: 'Seus neutros'
    },
    {
      id: 'cores-de-base',
      nome: 'Cores de base',
      criterioContraste: 'contraste baixo e médio',
      rotuloTela16: 'Cores do dia a dia'
    },
    {
      id: 'cores-de-destaque',
      nome: 'Cores de destaque',
      criterioContraste: 'contraste médio e alto',
      rotuloTela16: 'Cores de destaque'
    },
    {
      id: 'cores-a-evitar',
      nome: 'Cores a evitar',
      criterioContraste: 'conflita com a temperatura da família',
      rotuloTela16: 'Cores que roubam sua luz'
    }
  ];

  /* Sugestões iniciais da Matriz de Paletas. A coluna de cor de referência
     está vazia — pendência da Ilda (spec, seção 8). */
  var SUGESTOES_PALETA = {
    IP: {
      neutros: ['Preto', 'Branco puro', 'Cinza-grafite', 'Azul-marinho'],
      'cores-de-base': ['Azul-royal', 'Verde-esmeralda', 'Vinho', 'Fúcsia'],
      'cores-de-destaque': ['Magenta', 'Vermelho puro', 'Azul-elétrico', 'Roxo profundo'],
      'cores-a-evitar': ['Dourado intenso', 'Cobre claro', 'Bege quente', 'Laranja']
    },
    OP: {
      neutros: ['Marrom-café', 'Camelo escuro', 'Creme', 'Verde-oliva profundo'],
      'cores-de-base': ['Terracota', 'Ferrugem', 'Verde-floresta', 'Mostarda queimada'],
      'cores-de-destaque': ['Vinho', 'Cobre', 'Laranja queimado', 'Oliva'],
      'cores-a-evitar': ['Platinado', 'Perolado claro', 'Rosa-bebê', 'Azul-gelo']
    },
    PC: {
      neutros: ['Marfim', 'Cru', 'Areia', 'Branco quente'],
      'cores-de-base': ['Pêssego claro', 'Coral suave', 'Verde-maçã claro', 'Turquesa claro'],
      'cores-de-destaque': ['Coral vivo', 'Amarelo-ovo', 'Verde-esmeralda claro', 'Azul-piscina'],
      'cores-a-evitar': ['Preto puro', 'Cinza-grafite', 'Fúcsia escura', 'Vinho']
    },
    PE: {
      neutros: ['Bege dourado', 'Camelo', 'Marfim', 'Oliva claro'],
      'cores-de-base': ['Verde-musgo', 'Terracota suave', 'Turquesa', 'Amarelo mel'],
      'cores-de-destaque': ['Laranja queimado', 'Verde-esmeralda', 'Azul-pavão', 'Coral'],
      'cores-a-evitar': ['Cinza puro', 'Grafite', 'Platinado frio', 'Preto frio']
    },
    VC: {
      neutros: ['Off-white frio', 'Cinza-pérola', 'Azul-acinzentado', 'Rosa-poeira'],
      'cores-de-base': ['Lavanda', 'Azul-claro', 'Rosa-chá', 'Menta suave'],
      'cores-de-destaque': ['Azul-cobalto suave', 'Malva', 'Turquesa frio', 'Cereja'],
      'cores-a-evitar': ['Mostarda', 'Coral', 'Laranja', 'Marrom quente']
    },
    VE: {
      neutros: ['Cinza-azulado', 'Branco frio', 'Azul-marinho', 'Chumbo suave'],
      'cores-de-base': ['Azul-royal', 'Ameixa', 'Rosa-antigo', 'Verde-jade frio'],
      'cores-de-destaque': ['Fúcsia', 'Borgonha', 'Azul-elétrico frio', 'Turquesa profundo'],
      'cores-a-evitar': ['Dourado intenso', 'Acobreado', 'Vermelho quente', 'Mostarda']
    }
  };


  /* Seis opcoes extras por camada (pedido do Alysson, tela de paleta).
     Sao cores de roupa, nao de cabelo: seguem a temperatura da familia. */
  var EXTRA_PALETA = {
    quente: {
      'cores-de-base': ['Mostarda suave', 'Verde-oliva', 'Terracota clara', 'Caramelo', 'Areia', 'Café com leite'],
      'cores-de-destaque': ['Vermelho-tijolo', 'Laranja-âmbar', 'Verde-musgo', 'Ocre', 'Coral', 'Bordô quente']
    },
    fria: {
      'cores-de-base': ['Azul-petróleo', 'Cinza-prata', 'Lavanda', 'Ameixa', 'Verde-jade', 'Branco-óptico'],
      'cores-de-destaque': ['Fúcsia', 'Azul-cobalto', 'Roxo-violeta', 'Esmeralda profundo', 'Rosa-choque', 'Vinho frio']
    }
  };

  var MATRIZ_PALETAS = [];
  FAMILIAS.forEach(function (familia) {
    var sugestoes = SUGESTOES_PALETA[familia.sigla] || {};
    CAMADAS.forEach(function (camada) {
      MATRIZ_PALETAS.push({
        id: familia.sigla + '-' + camada.id,
        familia: familia.sigla,
        familiaNome: familia.nome,
        camada: camada.id,
        nomeCamada: camada.nome,
        criterioContraste: camada.criterioContraste,
        subtom: familia.temperatura,
        sugestoes: (sugestoes[camada.id] || []).slice().concat(((EXTRA_PALETA[familia.temperatura] || {})[camada.id] || [])),
        corReferencia: '',
        statusValidacao: 'sugestão — validar com a amostra física'
      });
    });
  });

  function formatarAltura(altura) {
    var n = Number(altura);
    if (!Number.isFinite(n)) return '—';
    return String(n).padStart(2, '0');
  }

  /* Nome do tom -> hex. Fonte única: paleta de vestuário (tela 16 e dossiê). */
var MAPA_CORES = {
    'Preto': '#141416',
    'Preto puro': '#0a0a0c',
    'Preto frio': '#15171c',
    'Branco puro': '#fcfcfc',
    'Branco frio': '#f2f5f9',
    'Branco quente': '#faf5ea',
    'Off-white frio': '#eceff4',
    'Cru': '#f3ece1',
    'Marfim': '#f7f2e4',
    'Areia': '#d8cbb5',
    'Creme': '#f8f1de',
    'Cinza-grafite': '#373c42',
    'Cinza puro': '#7d828a',
    'Cinza-pérola': '#cbcfd6',
    'Cinza-azulado': '#5b6c7e',
    'Grafite': '#3e4348',
    'Chumbo suave': '#484d54',
    'Platinado': '#e1e3e7',
    'Platinado frio': '#d5d9e0',
    'Perolado claro': '#e9e6df',
    'Azul-marinho': '#122544',
    'Azul-royal': '#1b4d9b',
    'Azul-elétrico': '#0d6efd',
    'Azul-elétrico frio': '#135bec',
    'Azul-cobalto suave': '#3b6ea8',
    'Azul-pavão': '#0a6474',
    'Azul-piscina': '#22b8cf',
    'Azul-acinzentado': '#687b8c',
    'Azul-claro': '#8cbde8',
    'Azul-gelo': '#c2dcf0',
    'Turquesa': '#18a89e',
    'Turquesa claro': '#59d2c7',
    'Turquesa frio': '#1fb8ac',
    'Turquesa profundo': '#096e68',
    'Verde-esmeralda': '#167d53',
    'Verde-esmeralda claro': '#3dbd87',
    'Verde-floresta': '#1c4a27',
    'Verde-oliva profundo': '#3e4823',
    'Verde-musgo': '#475a36',
    'Verde-maçã claro': '#96cc68',
    'Verde-jade frio': '#148767',
    'Oliva': '#64703a',
    'Oliva claro': '#859458',
    'Menta suave': '#9ddcc2',
    'Vinho': '#661427',
    'Borgonha': '#520e20',
    'Ameixa': '#541c3e',
    'Cereja': '#8a1736',
    'Fúcsia': '#bd1f6e',
    'Fúcsia escura': '#8a0d4b',
    'Magenta': '#c71585',
    'Malva': '#9b6b85',
    'Rosa-bebê': '#f2bfce',
    'Rosa-poeira': '#b58b99',
    'Rosa-chá': '#e5a8b7',
    'Rosa-antigo': '#9e6274',
    'Lavanda': '#a998ce',
    'Roxo profundo': '#3e174b',
    'Vermelho puro': '#c91e1e',
    'Vermelho quente': '#cb2d17',
    'Terracota': '#b85437',
    'Terracota suave': '#cb7358',
    'Ferrugem': '#8e3518',
    'Cobre': '#ad5832',
    'Cobre claro': '#c76e44',
    'Acobreado': '#9e4622',
    'Laranja': '#e35d18',
    'Laranja queimado': '#bd4c12',
    'Pêssego claro': '#f5b597',
    'Coral': '#dc5c48',
    'Coral suave': '#e67c6b',
    'Coral vivo': '#ea4328',
    'Dourado intenso': '#c9962a',
    'Amarelo mel': '#d49b29',
    'Amarelo-ovo': '#e8a917',
    'Mostarda': '#bf881d',
    'Mostarda queimada': '#9f6e14',
    'Bege quente': '#d8b993',
    'Bege dourado': '#caa87e',
    'Camelo': '#9f6e3c',
    'Camelo escuro': '#744a22',
    'Marrom-café': '#3a2618',
    'Marrom quente': '#572f1b'
  };

  return {
    ALTURAS: ALTURAS,
    FAMILIAS: FAMILIAS,
    FAMILIA_POR_SIGLA: FAMILIA_POR_SIGLA,
    familiaPorSigla: familiaPorSigla,
    FORMATOS_ROSTO: FORMATOS_ROSTO,
    formatoPorId: formatoPorId,
    CAMADAS: CAMADAS,
    MATRIZ_PALETAS: MATRIZ_PALETAS,
    MAPA_CORES: MAPA_CORES,
    formatarAltura: formatarAltura
  };
});
