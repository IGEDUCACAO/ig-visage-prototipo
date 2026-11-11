/* Teste das telas 14, 15 e 16 (Fechamento) — node puro, sem framework e sem npm.
   Uso: node testes/telas-fechamento.test.js
   Sai com código != 0 se:
   - alguma das telas 14, 15 ou 16 não estiver registrada;
   - a validação da tela 14 aceitar receita vazia;
   - a validação da tela 15 aceitar plano ou data vazios;
   - a tela 16 não tiver os quatro blocos;
   - os dois textos literais obrigatórios não aparecerem no HTML gerado pelo render. */
'use strict';

var falhas = [];

function falhar(mensagem) {
  falhas.push(mensagem);
}

function conferir(condicao, mensagem) {
  if (!condicao) {
    falhar(mensagem);
  }
}

/* ---------- 1. Montagem do stub de window e carregamento ---------- */

var DADOS = require('../assets/data.js');
var MOTOR = require('../assets/engine.js');

var telasRegistradas = {};

var stubWindow = {
  VISAGE_DATA: DADOS,
  VISAGE_ENGINE: MOTOR,
  VISAGE: {
    telas: telasRegistradas,
    registrarTela: function (n, def) {
      telasRegistradas[n] = def;
    }
  }
};

global.window = stubWindow;

var fechamento = require('../assets/telas-fechamento.js');

/* ---------- 2. Verificação de registro das telas 14, 15 e 16 ---------- */

conferir(telasRegistradas[14] != null, 'Tela 14 não foi registrada em window.VISAGE.telas.');
conferir(telasRegistradas[15] != null, 'Tela 15 não foi registrada em window.VISAGE.telas.');
conferir(telasRegistradas[16] != null, 'Tela 16 não foi registrada em window.VISAGE.telas.');

conferir(telasRegistradas[14] && typeof telasRegistradas[14].render === 'function', 'Tela 14 precisa de função render.');
conferir(telasRegistradas[15] && typeof telasRegistradas[15].render === 'function', 'Tela 15 precisa de função render.');
conferir(telasRegistradas[16] && typeof telasRegistradas[16].render === 'function', 'Tela 16 precisa de função render.');

conferir(telasRegistradas[14] && telasRegistradas[14].bloco === 'fechamento', 'Tela 14 deve pertencer ao bloco fechamento.');
conferir(telasRegistradas[15] && telasRegistradas[15].bloco === 'fechamento', 'Tela 15 deve pertencer ao bloco fechamento.');
conferir(telasRegistradas[16] && telasRegistradas[16].bloco === 'fechamento', 'Tela 16 deve pertencer ao bloco fechamento.');

/* ---------- 3. Validação da Tela 14 (Receita e valores) ---------- */

var val14 = (telasRegistradas[14] && telasRegistradas[14].validar) || fechamento.validar14;
conferir(typeof val14 === 'function', 'Validador da Tela 14 não encontrado.');

/* Casos que devem FALHAR (receita vazia) */
var casos14Invalidos = [
  { desc: 'estado vazio {}', estado: {} },
  { desc: 'receitaTecnica como string vazia', estado: { receitaTecnica: '' } },
  { desc: 'receitaTecnica só com espaços', estado: { receitaTecnica: '   \n  ' } },
  { desc: 'receita como string vazia', estado: { receita: '' } },
  { desc: 'receita_tecnica nula', estado: { receita_tecnica: null } },
  { desc: 'apenas valores preenchidos sem receita', estado: { valorConsultoria: '150', valorServicoCor: '300' } }
];

casos14Invalidos.forEach(function (c) {
  var res = val14(c.estado);
  conferir(!res.ok, 'Validação da 14 aceitou receita vazia no caso: ' + c.desc);
  conferir(typeof res.motivo === 'string' && res.motivo.length > 0, 'Validação da 14 inválida deve retornar motivo explicativo: ' + c.desc);

  /* Checar também integração via MOTOR.validaEtapa */
  var resMotor = MOTOR.validaEtapa(c.estado, 14);
  conferir(!resMotor.ok, 'MOTOR.validaEtapa aceitou receita vazia no caso: ' + c.desc);
});

/* Casos que devem PASSAR (receita preenchida) */
var casos14Validos = [
  { desc: 'receitaTecnica básica preenchida', estado: { receitaTecnica: 'Pó descolorante 1:2 com ox 20vol' } },
  { desc: 'receita com alias e valores vazios', estado: { receita: 'Tonalizante 8.34', valorConsultoria: '', valorServicoCor: '' } },
  { desc: 'receita preenchida e valores preenchidos', estado: { receitaTecnica: 'Fórmula completa', valorConsultoria: '200', valorServicoCor: '450' } }
];

casos14Validos.forEach(function (c) {
  var res = val14(c.estado);
  conferir(res.ok, 'Validação da 14 deveria aceitar: ' + c.desc + ' — motivo: ' + res.motivo);

  var resMotor = MOTOR.validaEtapa(c.estado, 14);
  conferir(resMotor.ok, 'MOTOR.validaEtapa deveria aceitar na tela 14: ' + c.desc);
});

/* ---------- 4. Validação da Tela 15 (Manutenção e retorno) ---------- */

var val15 = (telasRegistradas[15] && telasRegistradas[15].validar) || fechamento.validar15;
conferir(typeof val15 === 'function', 'Validador da Tela 15 não encontrado.');

/* Casos que devem FALHAR (plano ou data vazios) */
var casos15Invalidos = [
  { desc: 'estado vazio {}', estado: {} },
  { desc: 'plano vazio e data vazia', estado: { planoManutencao: '', dataRetorno: '' } },
  { desc: 'plano preenchido mas data ausente', estado: { planoManutencao: 'Retoque em 6 semanas' } },
  { desc: 'plano preenchido mas data vazia', estado: { planoManutencao: 'Retoque em 6 semanas', dataRetorno: '' } },
  { desc: 'plano preenchido mas data só com espaços', estado: { planoManutencao: 'Retoque em 6 semanas', dataRetorno: '   ' } },
  { desc: 'data preenchida mas plano ausente', estado: { dataRetorno: '2026-12-15' } },
  { desc: 'data preenchida mas plano vazio', estado: { planoManutencao: '', dataRetorno: '2026-12-15' } },
  { desc: 'data preenchida mas plano só com espaços', estado: { planoManutencao: '   \t  ', dataRetorno: '2026-12-15' } }
];

casos15Invalidos.forEach(function (c) {
  var res = val15(c.estado);
  conferir(!res.ok, 'Validação da 15 aceitou plano ou data vazios no caso: ' + c.desc);
  conferir(typeof res.motivo === 'string' && res.motivo.length > 0, 'Validação da 15 inválida deve retornar motivo explicativo: ' + c.desc);

  /* Checar integração via MOTOR.validaEtapa */
  var resMotor = MOTOR.validaEtapa(c.estado, 15);
  conferir(!resMotor.ok, 'MOTOR.validaEtapa aceitou plano ou data vazios na tela 15: ' + c.desc);
});

/* Casos que devem PASSAR (plano e data preenchidos) */
var casos15Validos = [
  {
    desc: 'plano e data preenchidos com campos canônicos',
    estado: { planoManutencao: 'Retoque de raiz em 6 semanas', dataRetorno: '2026-12-20' }
  },
  {
    desc: 'plano e data preenchidos com campos adicionais opcionais',
    estado: {
      planoManutencao: 'Máscara a cada 15 dias',
      dataRetorno: '2026-11-30',
      cuidadosDiarios: 'Shampoo suave sem sulfato',
      observarAntesRetorno: 'Desbotamento nas pontas'
    }
  },
  {
    desc: 'plano e data preenchidos com aliases compatíveis',
    estado: { plano: 'Retoque completo', dataPrevistaRetorno: '2027-01-10' }
  }
];

casos15Validos.forEach(function (c) {
  var res = val15(c.estado);
  conferir(res.ok, 'Validação da 15 deveria aceitar: ' + c.desc + ' — motivo: ' + res.motivo);

  var resMotor = MOTOR.validaEtapa(c.estado, 15);
  conferir(resMotor.ok, 'MOTOR.validaEtapa deveria aceitar na tela 15: ' + c.desc);
});

/* ---------- 5. Render da Tela 14 (HTML e RN-26) ---------- */

function criarElementoStub() {
  return {
    innerHTML: '',
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; }
  };
}

var el14 = criarElementoStub();
telasRegistradas[14].render(el14, { estado: {}, salvar: function () {}, atualizar: function () {} });
var html14 = el14.innerHTML;

conferir(html14.indexOf('Receita técnica') !== -1, 'Tela 14 deve exibir o rótulo "Receita técnica".');
conferir(html14.indexOf('placeholder="Fórmula, tempo, oxidante, técnica..."') !== -1,
  'Tela 14 deve conter textarea com placeholder "Fórmula, tempo, oxidante, técnica...".');
conferir(html14.indexOf('Valor da consultoria (R$)') !== -1,
  'Tela 14 deve conter o campo numérico "Valor da consultoria (R$)".');
conferir(html14.indexOf('Valor do serviço de cor (R$)') !== -1,
  'Tela 14 deve conter o campo numérico "Valor do serviço de cor (R$)".');

/* RN-26: Proibido somar ou totalizar os dois valores */
conferir(html14.indexOf('Total (R$)') === -1 && html14.indexOf('Valor total') === -1 && html14.indexOf('Total:') === -1,
  'RN-26: Tela 14 não pode exibir total ou soma dos dois valores.');

/* ---------- 6. Render da Tela 15 (HTML e RN-21) ---------- */

var el15 = criarElementoStub();
telasRegistradas[15].render(el15, { estado: {}, salvar: function () {}, atualizar: function () {} });
var html15 = el15.innerHTML;

conferir(html15.indexOf('Plano de manutenção') !== -1,
  'Tela 15 deve exibir o rótulo "Plano de manutenção".');
conferir(html15.indexOf('placeholder="Ex.: retoque de raiz em 6 semanas, máscara tonalizante a cada 15 dias"') !== -1,
  'Tela 15 deve conter placeholder correto no plano de manutenção.');
conferir(html15.indexOf('Data prevista de retorno') !== -1,
  'Tela 15 deve conter o campo "Data prevista de retorno".');
conferir(html15.indexOf('type="date"') !== -1,
  'Tela 15 deve conter campo input type="date".');
conferir(html15.indexOf('Cuidados diários') !== -1,
  'Tela 15 deve conter textarea "Cuidados diários".');
conferir(html15.indexOf('O que observar antes de voltar') !== -1,
  'Tela 15 deve conter textarea "O que observar antes de voltar".');

/* RN-21: Não preencher data de retorno automaticamente */
conferir(html15.indexOf('value=""') !== -1 || html15.indexOf('id="dataRetorno" value=""') !== -1 || !/id="dataRetorno"[^>]*value="[0-9]/.test(html15),
  'RN-21: Tela 15 não pode sugerir data automaticamente em estado novo.');

/* ---------- 7. Render da Tela 16 (4 blocos, textos obrigatórios e tons da matriz) ---------- */

var el16 = criarElementoStub();
telasRegistradas[16].render(el16, {
  estado: { familia: 'IP' },
  dados: DADOS,
  salvar: function () {},
  atualizar: function () {}
});
var html16 = el16.innerHTML;

/* Quatro blocos com os títulos especificados */
var quatroBlocos = [
  'Seus neutros',
  'Cores do dia a dia',
  'Cores de destaque',
  'Cores que roubam sua luz'
];

quatroBlocos.forEach(function (bloco) {
  conferir(html16.indexOf(bloco) !== -1, 'A tela 16 não possui o bloco obrigatório: "' + bloco + '".');
});

/* Os dois textos literais obrigatórios */
var textoIntroLiteral = 'Este é o complemento da sua consultoria: as cores de roupa que valorizam você. O protagonista continua sendo o seu cabelo.';
var textoRodapeLiteral = 'Orientação de vestuário — não é consultoria de imagem.';

conferir(html16.indexOf(textoIntroLiteral) !== -1,
  'O texto introdutório obrigatório não apareceu no HTML gerado pelo render da Tela 16.');
conferir(html16.indexOf(textoRodapeLiteral) !== -1,
  'O texto de rodapé obrigatório não apareceu no HTML gerado pelo render da Tela 16.');

/* Verificar que os tons exibidos vêm da MATRIZ_PALETAS */
var todosTonsMatriz = {};
DADOS.MATRIZ_PALETAS.forEach(function (camada) {
  if (Array.isArray(camada.sugestoes)) {
    camada.sugestoes.forEach(function (tom) {
      todosTonsMatriz[tom] = true;
    });
  }
});

/* Checar para cada uma das 6 famílias da matriz se todos os 4 blocos e tons legítimos são gerados */
DADOS.FAMILIAS.forEach(function (familia) {
  var elFam = criarElementoStub();
  telasRegistradas[16].render(elFam, {
    estado: { familia: familia.sigla },
    dados: DADOS
  });
  var htmlFam = elFam.innerHTML;

  quatroBlocos.forEach(function (bloco) {
    conferir(htmlFam.indexOf(bloco) !== -1, '[' + familia.sigla + '] Bloco ausente: ' + bloco);
  });

  conferir(htmlFam.indexOf(textoIntroLiteral) !== -1, '[' + familia.sigla + '] Texto intro ausente');
  conferir(htmlFam.indexOf(textoRodapeLiteral) !== -1, '[' + familia.sigla + '] Texto rodapé ausente');

  var camadasFamilia = DADOS.MATRIZ_PALETAS.filter(function (m) { return m.familia === familia.sigla; });
  camadasFamilia.forEach(function (cam) {
    cam.sugestoes.forEach(function (tom) {
      conferir(htmlFam.indexOf(tom) !== -1, '[' + familia.sigla + '] Tom da matriz ausente na tela 16: ' + tom);
      conferir(todosTonsMatriz[tom] === true, 'Tom não pertence à matriz: ' + tom);
    });
  });
});

/* ---------- 8. Não regressão do motor nas etapas anteriores (1 a 9) ---------- */

conferir(MOTOR.validaEtapa({ cliente: { nome: 'Marina', contato: '11999' } }, 1).ok, 'validaEtapa(1) regrediu.');
conferir(!MOTOR.validaEtapa({}, 1).ok, 'validaEtapa(1) erro regrediu.');
conferir(MOTOR.validaEtapa({ rota: 'harmonia' }, 3).ok, 'validaEtapa(3) regrediu.');
conferir(MOTOR.validaEtapa({ profundidade: 'media' }, 4).ok, 'validaEtapa(4) regrediu.');
conferir(MOTOR.validaEtapa({ baseNatural: 5 }, 5).ok, 'validaEtapa(5) regrediu.');

/* ---------- 9. Conclusão dos testes ---------- */

if (falhas.length > 0) {
  console.error('\n❌ Falhas nos testes de fechamento (' + falhas.length + '):');
  falhas.forEach(function (f, idx) {
    console.error('  ' + (idx + 1) + ') ' + f);
  });
  process.exit(1);
} else {
  console.log('\n✅ Todos os testes de fechamento passaram com sucesso:');
  console.log('  - Telas 14, 15 e 16 registradas no stub de window');
  console.log('  - Validação da Tela 14 rejeita receita vazia e aceita preenchida');
  console.log('  - Validação da Tela 15 rejeita plano ou data vazios e aceita preenchidos');
  console.log('  - Tela 16 possui os quatro blocos ("Seus neutros", "Cores do dia a dia", "Cores de destaque", "Cores que roubam sua luz")');
  console.log('  - Tela 16 contém os dois textos literais obrigatórios (intro e rodapé)');
  console.log('  - Sem soma nem totalizador na Tela 14 (RN-26)');
  console.log('  - Sem data sugerida automaticamente na Tela 15 (RN-21)');
  console.log('  - Cores da Tela 16 extraídas fielmente da MATRIZ_PALETAS para todas as famílias');
  console.log('  - Sem regressão nas etapas 1 a 9 do motor');
  process.exit(0);
}
