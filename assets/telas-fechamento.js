/* Telas 14, 15 e 16 — bloco Fechamento.
   Registradas em window.VISAGE.registrarTela(n, {titulo, bloco, render(el, ctx)}).
   Regras de negócio:
   - RN-21: campo de data manual; não sugere data automaticamente.
   - RN-26: valores de consultoria e serviço são independentes; nunca somados, nunca totalizados. */
(function (root, factory) {
  'use strict';

  if (typeof module !== 'undefined' && module.exports) {
    var win = typeof window !== 'undefined' ? window : (root.window || root);
    var DADOS = win.VISAGE_DATA || root.VISAGE_DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
    var MOTOR = win.VISAGE_ENGINE || root.VISAGE_ENGINE || (typeof require !== 'undefined' ? require('./engine.js') : null);
    module.exports = factory(root, win, DADOS, MOTOR);
  } else {
    var win = typeof window !== 'undefined' ? window : root;
    factory(root, win, win.VISAGE_DATA || root.VISAGE_DATA, win.VISAGE_ENGINE || root.VISAGE_ENGINE);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, win, DADOS, MOTOR) {
  'use strict';

  var VISAGE = win.VISAGE = win.VISAGE || root.VISAGE || {};
  VISAGE.telas = VISAGE.telas || {};
  if (typeof VISAGE.registrarTela !== 'function') {
    VISAGE.registrarTela = function (n, definicao) { VISAGE.telas[n] = definicao; };
  }

  /* ---------- Helpers de formatação e escape ---------- */

  function esc(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function textoValido(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
  }

  /* Mapa de cores visuais para as sugestões da Matriz de Paletas (direção de tela) */
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

  /* ---------- Validações ---------- */

  function validar14(estado) {
    var e = estado || {};
    var receita = (e.receitaTecnica != null ? e.receitaTecnica : (e.receita != null ? e.receita : e.receita_tecnica));
    if (!textoValido(receita)) {
      return {
        ok: false,
        motivo: 'Preencha a receita técnica (fórmula, tempo, oxidante, técnica).'
      };
    }
    return { ok: true, motivo: '' };
  }

  function validar15(estado) {
    var e = estado || {};
    var plano = (e.planoManutencao != null ? e.planoManutencao : (e.plano != null ? e.plano : e.plano_manutencao));
    if (!textoValido(plano)) {
      return {
        ok: false,
        motivo: 'Preencha o plano de manutenção antes de continuar.'
      };
    }
    var data = (e.dataRetorno != null ? e.dataRetorno : (e.dataPrevistaRetorno != null ? e.dataPrevistaRetorno : e.data_retorno));
    if (!textoValido(data)) {
      return {
        ok: false,
        motivo: 'Informe a data prevista de retorno (preenchimento manual, RN-21).'
      };
    }
    return { ok: true, motivo: '' };
  }

  function validar16(estado) {
    return { ok: true, motivo: '' };
  }

  /* Integrar validação com MOTOR.validaEtapa se disponível */
  if (MOTOR && typeof MOTOR.validaEtapa === 'function') {
    var validaOriginal = MOTOR.validaEtapa;
    MOTOR.validaEtapa = function (estado, numeroDaTela) {
      var n = Number(numeroDaTela);
      if (n === 14) return validar14(estado);
      if (n === 15) return validar15(estado);
      if (n === 16) return validar16(estado);
      return validaOriginal(estado, numeroDaTela);
    };
  }

  /* ---------- TELA 14 — Receita e valores ---------- */

  function render14(el, ctx) {
    var e = (ctx && ctx.estado) || {};
    var receita = (e.receitaTecnica != null ? e.receitaTecnica : (e.receita != null ? e.receita : (e.receita_tecnica || '')));
    var valConsultoria = (e.valorConsultoria != null ? e.valorConsultoria : (e.valor_consultoria != null ? e.valor_consultoria : ''));
    var valServico = (e.valorServicoCor != null ? e.valorServicoCor : (e.valor_servico_cor != null ? e.valor_servico_cor : ''));

    el.innerHTML =
      '<h2>Receita e valores</h2>' +
      '<p class="lead">Registre a fórmula e as etapas técnicas da aplicação. Os valores de consultoria e de serviço são independentes e opcionais.</p>' +
      '<section class="cartao" aria-labelledby="tituloReceita">' +
        '<p class="sobretitulo" id="tituloReceita">Procedimento técnico</p>' +
        '<div class="campo">' +
          '<label class="rotulo" for="receitaTecnica">Receita técnica <span class="obrigatorio" aria-hidden="true">*</span></label>' +
          '<textarea id="receitaTecnica" placeholder="Fórmula, tempo, oxidante, técnica..." rows="4">' + esc(receita) + '</textarea>' +
          '<p class="hint">Descreva produtos, proporções de mistura, tempo de pausa e técnica empregada.</p>' +
        '</div>' +
      '</section>' +
      '<section class="cartao" aria-labelledby="tituloValores">' +
        '<p class="sobretitulo" id="tituloValores">Precificação (opcional)</p>' +
        '<div class="grade grade-2">' +
          '<div class="campo">' +
            '<label class="rotulo" for="valorConsultoria">Valor da consultoria (R$)</label>' +
            '<input type="number" id="valorConsultoria" min="0" step="0.01" placeholder="0,00" value="' + esc(valConsultoria) + '">' +
          '</div>' +
          '<div class="campo">' +
            '<label class="rotulo" for="valorServicoCor">Valor do serviço de cor (R$)</label>' +
            '<input type="number" id="valorServicoCor" min="0" step="0.01" placeholder="0,00" value="' + esc(valServico) + '">' +
          '</div>' +
        '</div>' +
        '<p class="hint">Regra RN-26: os valores da consultoria e do serviço são independentes — nunca somados, nunca totalizados e nunca sugeridos.</p>' +
      '</section>' +
      '<div class="nota"><b>Valores independentes (RN-26):</b> O método mantém a precificação da consultoria separada do procedimento de salão para proteger a remuneração de cada etapa. Nenhum totalizador é gerado.</div>';

    if (!el.querySelector) return;

    var txtReceita = el.querySelector('#receitaTecnica');
    if (txtReceita) {
      txtReceita.addEventListener('input', function () {
        var v = txtReceita.value;
        e.receitaTecnica = v;
        e.receita = v;
        e.receita_tecnica = v;
        if (ctx && typeof ctx.salvar === 'function') ctx.salvar();
        if (ctx && typeof ctx.atualizar === 'function') ctx.atualizar();
      });
    }

    var inpConsultoria = el.querySelector('#valorConsultoria');
    if (inpConsultoria) {
      inpConsultoria.addEventListener('input', function () {
        var v = inpConsultoria.value;
        e.valorConsultoria = v;
        e.valor_consultoria = v;
        if (ctx && typeof ctx.salvar === 'function') ctx.salvar();
      });
    }

    var inpServico = el.querySelector('#valorServicoCor');
    if (inpServico) {
      inpServico.addEventListener('input', function () {
        var v = inpServico.value;
        e.valorServicoCor = v;
        e.valor_servico_cor = v;
        if (ctx && typeof ctx.salvar === 'function') ctx.salvar();
      });
    }
  }

  /* ---------- TELA 15 — Manutenção e retorno ---------- */

  function render15(el, ctx) {
    var e = (ctx && ctx.estado) || {};
    var plano = (e.planoManutencao != null ? e.planoManutencao : (e.plano != null ? e.plano : (e.plano_manutencao || '')));
    var dataRetorno = (e.dataRetorno != null ? e.dataRetorno : (e.dataPrevistaRetorno != null ? e.dataPrevistaRetorno : (e.data_retorno || '')));
    var cuidados = (e.cuidadosDiarios != null ? e.cuidadosDiarios : (e.cuidados_diarios || ''));
    var observar = (e.observarAntesRetorno != null ? e.observarAntesRetorno : (e.observar_antes_retorno != null ? e.observar_antes_retorno : (e.observarAntesVoltar || '')));

    el.innerHTML =
      '<h2>Manutenção e retorno</h2>' +
      '<p class="lead">Oriente a cliente sobre os cuidados entre atendimentos e defina o retorno presencial.</p>' +
      '<section class="cartao" aria-labelledby="tituloManutencao">' +
        '<p class="sobretitulo" id="tituloManutencao">Plano e retorno</p>' +
        '<div class="campo">' +
          '<label class="rotulo" for="planoManutencao">Plano de manutenção <span class="obrigatorio" aria-hidden="true">*</span></label>' +
          '<textarea id="planoManutencao" placeholder="Ex.: retoque de raiz em 6 semanas, máscara tonalizante a cada 15 dias" rows="3">' + esc(plano) + '</textarea>' +
        '</div>' +
        '<div class="campo">' +
          '<label class="rotulo" for="dataRetorno">Data prevista de retorno <span class="obrigatorio" aria-hidden="true">*</span></label>' +
          '<input type="date" id="dataRetorno" value="' + esc(dataRetorno) + '">' +
          '<p class="hint">Regra RN-21: campo de data manual. O app não calcula nem sugere data automaticamente; o lembrete dispara na data definida pela profissional.</p>' +
        '</div>' +
      '</section>' +
      '<section class="cartao" aria-labelledby="tituloCuidados">' +
        '<p class="sobretitulo" id="tituloCuidados">Orientações complementares</p>' +
        '<div class="campo">' +
          '<label class="rotulo" for="cuidadosDiarios">Cuidados diários</label>' +
          '<textarea id="cuidadosDiarios" placeholder="Rotina de lavagem, produtos para home care, proteção térmica e solar..." rows="3">' + esc(cuidados) + '</textarea>' +
        '</div>' +
        '<div class="campo">' +
          '<label class="rotulo" for="observarAntesRetorno">O que observar antes de voltar</label>' +
          '<textarea id="observarAntesRetorno" placeholder="Sinais de alteração de tom, porosidade, ressecamento ou crescimento..." rows="3">' + esc(observar) + '</textarea>' +
        '</div>' +
      '</section>' +
      '<div class="nota"><b>Acompanhamento (RN-21):</b> A data definida manualmente garante que o contato de retorno respeite o ciclo fisiológico e técnico de cada fio.</div>';

    if (!el.querySelector) return;

    var txtPlano = el.querySelector('#planoManutencao');
    if (txtPlano) {
      txtPlano.addEventListener('input', function () {
        var v = txtPlano.value;
        e.planoManutencao = v;
        e.plano = v;
        e.plano_manutencao = v;
        if (ctx && typeof ctx.salvar === 'function') ctx.salvar();
        if (ctx && typeof ctx.atualizar === 'function') ctx.atualizar();
      });
    }

    var inpData = el.querySelector('#dataRetorno');
    if (inpData) {
      inpData.addEventListener('input', function () {
        var v = inpData.value;
        e.dataRetorno = v;
        e.dataPrevistaRetorno = v;
        e.data_retorno = v;
        if (ctx && typeof ctx.salvar === 'function') ctx.salvar();
        if (ctx && typeof ctx.atualizar === 'function') ctx.atualizar();
      });
    }

    var txtCuidados = el.querySelector('#cuidadosDiarios');
    if (txtCuidados) {
      txtCuidados.addEventListener('input', function () {
        var v = txtCuidados.value;
        e.cuidadosDiarios = v;
        e.cuidados_diarios = v;
        if (ctx && typeof ctx.salvar === 'function') ctx.salvar();
      });
    }

    var txtObservar = el.querySelector('#observarAntesRetorno');
    if (txtObservar) {
      txtObservar.addEventListener('input', function () {
        var v = txtObservar.value;
        e.observarAntesRetorno = v;
        e.observar_antes_retorno = v;
        e.observarAntesVoltar = v;
        if (ctx && typeof ctx.salvar === 'function') ctx.salvar();
      });
    }
  }

  /* ---------- TELA 16 — Paleta de vestuário (complemento) ---------- */

  var BLOCOS_PALETA = [
    {
      id: 'neutros',
      titulo: 'Seus neutros',
      descricao: 'Bases neutras que equilibram e sustentam composições harmônicas.'
    },
    {
      id: 'cores-de-base',
      titulo: 'Cores do dia a dia',
      descricao: 'Tons equilibrados para o uso frequente na rotina.'
    },
    {
      id: 'cores-de-destaque',
      titulo: 'Cores de destaque',
      descricao: 'Cores que trazem contraste, energia e presença.'
    },
    {
      id: 'cores-a-evitar',
      titulo: 'Cores que roubam sua luz',
      descricao: 'Tons que concorrem com sua temperatura ou apagam o brilho natural.'
    }
  ];

  function render16(el, ctx) {
    var dados = (ctx && ctx.dados) || DADOS || win.VISAGE_DATA;
    var matriz = (dados && dados.MATRIZ_PALETAS) || [];
    var e = (ctx && ctx.estado) || {};

    var siglaFamilia = '';
    var familiaNome = '';
    if (e.familia) {
      if (typeof e.familia === 'string') {
        siglaFamilia = e.familia.toUpperCase();
      } else if (e.familia.sigla) {
        siglaFamilia = String(e.familia.sigla).toUpperCase();
        familiaNome = e.familia.nome || '';
      }
    }

    /* Fallback para visualização na demonstração caso a família não tenha sido selecionada ainda */
    if (!siglaFamilia && dados && Array.isArray(dados.FAMILIAS) && dados.FAMILIAS.length > 0) {
      siglaFamilia = dados.FAMILIAS[0].sigla;
      familiaNome = dados.FAMILIAS[0].nome;
    } else if (siglaFamilia && !familiaNome && dados && typeof dados.familiaPorSigla === 'function') {
      var famEncontrada = dados.familiaPorSigla(siglaFamilia);
      if (famEncontrada) familiaNome = famEncontrada.nome;
    }

    var blocosHtml = BLOCOS_PALETA.map(function (bloco) {
      var entrada = null;
      for (var i = 0; i < matriz.length; i++) {
        if (String(matriz[i].familia).toUpperCase() === siglaFamilia && matriz[i].camada === bloco.id) {
          entrada = matriz[i];
          break;
        }
      }

      var tons = (entrada && Array.isArray(entrada.sugestoes)) ? entrada.sugestoes : [];

      var itensHtml = '';
      if (tons.length > 0) {
        itensHtml = '<div class="grade-paleta" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0 8px;">' +
          tons.map(function (tom) {
            var hex = MAPA_CORES[tom] || '#a9855a';
            return '<div class="item-paleta" style="display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid var(--line);border-radius:12px;background:var(--card);">' +
              '<span class="amostra-paleta-cor" style="width:26px;height:26px;border-radius:50%;background-color:' + hex + ';border:1.5px solid rgba(0,0,0,0.12);flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,0.08);" aria-hidden="true"></span>' +
              '<span class="amostra-paleta-nome" style="font-size:13.5px;font-weight:600;color:var(--ink);line-height:1.25;">' + esc(tom) + '</span>' +
              '</div>';
          }).join('') +
          '</div>';
      } else {
        itensHtml = '<p class="texto-suave">Nenhum tom registrado nesta camada na matriz.</p>';
      }

      return '<section class="cartao cartao-bloco-paleta">' +
        '<p class="sobretitulo">' + esc(bloco.titulo) + '</p>' +
        '<h3>' + esc(bloco.titulo) + '</h3>' +
        '<p class="texto-suave">' + esc(bloco.descricao) + '</p>' +
        itensHtml +
        '<p class="hint">sugestão — validar com a amostra física</p>' +
        '</section>';
    }).join('');

    el.innerHTML =
      '<h2>Paleta de vestuário</h2>' +
      '<p class="lead">Este é o complemento da sua consultoria: as cores de roupa que valorizam você. O protagonista continua sendo o seu cabelo.</p>' +
      (familiaNome ? '<p class="sobretitulo">Família diagnosticada: <b>' + esc(familiaNome) + ' (' + esc(siglaFamilia) + ')</b></p>' : '') +
      blocosHtml +
      '<div class="nota">' +
        '<b>Orientação de vestuário — não é consultoria de imagem.</b> Esta paleta serve como guia prático de roupas e acessórios alinhados à sua temperatura e contraste natural.' +
      '</div>';
  }

  /* ---------- Registro das Telas ---------- */

  var def14 = {
    titulo: 'Receita e valores',
    bloco: 'fechamento',
    render: render14,
    validar: validar14
  };

  var def15 = {
    titulo: 'Manutenção e retorno',
    bloco: 'fechamento',
    render: render15,
    validar: validar15
  };

  var def16 = {
    titulo: 'Paleta de vestuário',
    bloco: 'fechamento',
    render: render16,
    validar: validar16
  };

  VISAGE.registrarTela(14, def14);
  VISAGE.registrarTela(15, def15);
  VISAGE.registrarTela(16, def16);

  VISAGE.validarTela14 = validar14;
  VISAGE.validarTela15 = validar15;
  VISAGE.validarTela16 = validar16;

  return {
    validar14: validar14,
    validar15: validar15,
    validar16: validar16,
    validarTela14: validar14,
    validarTela15: validar15,
    validarTela16: validar16,
    render14: render14,
    render15: render15,
    render16: render16,
    telas: {
      14: def14,
      15: def15,
      16: def16
    }
  };
});
