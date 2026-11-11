/* Telas 10 a 13 — bloco Prescrição.
   Família e calibração, teto e faixa, conflito e escolha da amostra.
   Registradas em window.VISAGE.registrarTela(n, {titulo, bloco, render(el, ctx)}).
   As regras ficam em funções puras, exportadas para teste (module.exports no node). */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(root, require('./data.js'), require('./engine.js'));
  } else {
    root.VISAGE_PRESCRICAO = factory(root, root.VISAGE_DATA, root.VISAGE_ENGINE);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, DADOS, MOTOR) {
  'use strict';

  var temJanela = typeof window !== 'undefined' && window !== null;
  var VISAGE = temJanela ? (window.VISAGE = window.VISAGE || {}) : null;

  if (!DADOS || !DADOS.ALTURAS || !MOTOR || typeof MOTOR.amostrasViaveis !== 'function' ||
      typeof MOTOR.familiaPrescrita !== 'function' || typeof MOTOR.calibracaoDeContraste !== 'function') {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[visage] telas-prescricao.js precisa de assets/data.js e assets/engine.js carregados antes.');
    }
    return {};
  }

  if (VISAGE) {
    VISAGE.telas = VISAGE.telas || {};
    if (typeof VISAGE.registrarTela !== 'function') {
      VISAGE.registrarTela = function (n, definicao) { VISAGE.telas[n] = definicao; };
    }
  }

  /* ---------- regras puras ---------- */

  var ROTULO_PROFUNDIDADE = { 1: 'clara', 2: 'media', 3: 'profunda' };
  var ROTULO_NIVEL = { baixo: 'baixo', medio: 'médio', alto: 'alto' };

  /* A família cruza profundidade × temperatura (v1: famOf). A regra tem um dono só: assets/engine.js. */

  var DECISOES = {
    'ponto-mais-alto': 'Entregar o ponto mais alto que o fio suporta (mantendo a temperatura da família)',
    'adiar': 'Adiar a cor e tratar o fio primeiro'
  };

  function normalizar(valor) {
    if (typeof valor !== 'string') return '';
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  }

  function temperaturaDe(estado) {
    var t = normalizar(estado && estado.temperatura);
    return (t === 'fria' || t === 'neutra' || t === 'quente') ? t : null;
  }

  /* Família prescrita: o estado manda; sem ele, deriva da leitura profundidade × temperatura.
     Sem profundidade ou sem temperatura não há família — a tela diz o que falta. */
  function familiaPrescrita(estado) {
    var e = estado || {};
    var registrada = DADOS.familiaPorSigla(e.familia);
    if (registrada) return registrada;

    return MOTOR.familiaPrescrita(e.profundidade, e.temperatura);
  }

  /* Regra da Ilda (spec v2, TELA 10): baixo ou médio → Suave; alto → Intensa. */
  function calibracaoPorContraste(nivel) {
    return MOTOR.calibracaoDeContraste(nivel);
  }

  /* RN-24: na Rota Estilo o rótulo não é "prescrita". */
  function rotulosDaRota(rota) {
    if (rota === 'estilo') {
      return { familia: 'Ponto de partida', calibracao: 'Calibração proposta' };
    }
    if (rota === 'iris') {
      return { familia: 'Família de referência', calibracao: 'Calibração de referência' };
    }
    return { familia: 'Família prescrita', calibracao: 'Calibração prescrita' };
  }

  /* O teto nasce da base natural; o teto gravado só vale como fallback
     quando a base não está no prontuário. */
  function tetoDoEstado(estado) {
    var e = estado || {};
    if (MOTOR.alturaDeMercado(e.baseNatural)) {
      var familia = familiaPrescrita(e);
      return MOTOR.tetoDeClareamento(e.baseNatural, familia ? familia.tetoClareamento : 4);
    }
    var teto = Number(e.teto);
    if (Number.isInteger(teto) && DADOS.ALTURAS.indexOf(teto) !== -1) return teto;
    return null;
  }

  /* Tela 13: SOMENTE amostras da família que cabem no teto — nunca a matriz inteira. */
  function amostrasDaTela13(estado) {
    var e = estado || {};
    var familia = familiaPrescrita(e);
    var teto = tetoDoEstado(e);
    if (!familia || teto === null) return [];
    return MOTOR.amostrasViaveis(familia, teto).filter(function (amostra) {
      return Number(amostra && amostra.altura) <= teto;
    });
  }

  function registrarDecisao(estado, escolha, agora) {
    if (!estado || typeof estado !== 'object') {
      throw new Error('registrarDecisao espera o estado do prontuário.');
    }
    if (!DECISOES[escolha]) {
      throw new Error('Decisão inválida: "' + escolha + '". Use "ponto-mais-alto" ou "adiar".');
    }
    var momento = agora instanceof Date ? agora : new Date();
    estado.decisaoConflito = {
      escolha: escolha,
      rotulo: DECISOES[escolha],
      data: momento.toISOString()
    };
    return estado.decisaoConflito;
  }

  /* Amostra escolhida só existe dentro do teto — acima dele, erro explícito. */
  function registrarAmostra(estado, codigo, agora) {
    var viaveis = amostrasDaTela13(estado);
    var escolhida = viaveis.filter(function (amostra) { return amostra.codigo === codigo; })[0];
    if (!escolhida) {
      var familia = familiaPrescrita(estado);
      var teto = tetoDoEstado(estado);
      throw new Error('Amostra "' + codigo + '" não está dentro do teto ' +
        (teto === null ? '—' : DADOS.formatarAltura(teto)) +
        ' da família ' + (familia ? familia.sigla : '—') + '.');
    }
    var momento = agora instanceof Date ? agora : new Date();
    estado.amostraEscolhida = {
      codigo: escolhida.codigo,
      nome: escolhida.nome,
      altura: escolhida.altura,
      hex: escolhida.hex,
      data: momento.toISOString()
    };
    return estado.amostraEscolhida;
  }

  /* validaEtapa do motor trata as telas 10 a 17 como livres; aqui ficam as
     regras "obrigatório" das telas 12 e 13. */
  function validarAvancar(numero, estado) {
    var n = Number(numero);
    var e = estado || {};

    if (n === 12) {
      if (!e.decisaoConflito || !DECISOES[e.decisaoConflito.escolha]) {
        return { ok: false, motivo: 'Registre a decisão do conflito antes de seguir: entregar o ponto mais alto ou adiar a cor.' };
      }
      return { ok: true, motivo: '' };
    }

    if (n === 13) {
      var viaveis = amostrasDaTela13(e);
      if (!viaveis.length) {
        return { ok: false, motivo: 'Não há amostra da família dentro do teto para escolher.' };
      }
      var escolhida = e.amostraEscolhida;
      var dentro = !!escolhida && viaveis.some(function (amostra) {
        return amostra.codigo === escolhida.codigo;
      });
      if (!dentro) {
        return { ok: false, motivo: 'Escolha uma das amostras dentro do teto antes de seguir.' };
      }
      return { ok: true, motivo: '' };
    }

    return { ok: true, motivo: '' };
  }

  /* ---------- helpers de UI ---------- */

  function esc(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hh(altura) {
    return DADOS.formatarAltura(altura);
  }

  function formatarData(iso) {
    if (!iso) return '—';
    var data = new Date(iso);
    if (Number.isNaN(data.getTime())) return String(iso);
    try {
      return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch (err) {
      return data.toLocaleString('pt-BR');
    }
  }

  function linha(rotulo, valor) {
    return '<div class="linha-leitura">' +
      '<span class="linha-rotulo-texto">' + esc(rotulo) + '</span>' +
      '<span class="linha-valor">' + esc(valor) + '</span>' +
      '</div>';
  }

  function faixaTexto(familia) {
    if (!familia || !Array.isArray(familia.faixa)) return '—';
    return hh(familia.faixa[0]) + ' a ' + hh(familia.faixa[1]);
  }

  function leituraTexto(estado) {
    var profundidade = ROTULO_PROFUNDIDADE[MOTOR.indiceProfundidade(estado.profundidade)] || null;
    var temperatura = temperaturaDe(estado);
    if (!profundidade || !temperatura) {
      return (profundidade || '—') + ' · ' + (temperatura || '—');
    }
    return profundidade + ' · ' + temperatura;
  }

  /* Grava família e teto no prontuário: o roteador da tela 11 lê exatamente esses campos. */
  function sincronizar(estado, ctx) {
    var familia = familiaPrescrita(estado);
    var mudou = false;

    if (familia && estado.familia !== familia.sigla) {
      estado.familia = familia.sigla;
      mudou = true;
    }
    var teto = tetoDoEstado(estado);
    if (teto !== null && estado.teto !== teto) {
      estado.teto = teto;
      mudou = true;
    }
    if (mudou && ctx && typeof ctx.salvar === 'function') ctx.salvar();
    return { familia: familia, teto: teto };
  }

  function recarregarCom(ctx) {
    if (typeof ctx.salvar === 'function') ctx.salvar();
    if (typeof ctx.recarregar === 'function') ctx.recarregar();
  }

  /* ---------- guarda do Continuar (telas 12 e 13) ---------- */

  var estadoMontado = null;
  var guardaInstalada = false;

  function secaoMontada() {
    if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return null;
    var secao = document.querySelector('[data-tela-prescricao]');
    if (!secao || typeof secao.getAttribute !== 'function') return null;
    var numero = Number(secao.getAttribute('data-tela-prescricao'));
    return Number.isInteger(numero) ? numero : null;
  }

  function mostrarMotivo(mensagem) {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    var motivo = document.getElementById('rodapeMotivo');
    if (motivo) motivo.textContent = mensagem;
  }

  function instalarGuarda() {
    if (guardaInstalada) return;
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    guardaInstalada = true;

    document.addEventListener('click', function (evento) {
      var alvo = evento.target;
      while (alvo && alvo.nodeType === 1) {
        if (alvo.id === 'avancar') break;
        alvo = alvo.parentNode;
      }
      if (!alvo || alvo.nodeType !== 1 || alvo.id !== 'avancar') return;

      var numero = secaoMontada();
      if (numero !== 12 && numero !== 13) return;

      var cheque = validarAvancar(numero, estadoMontado || {});
      if (cheque.ok) return;

      evento.preventDefault();
      evento.stopPropagation();
      mostrarMotivo(cheque.motivo);
    }, true);
  }

  /* ---------- TELA 10 ---------- */

  var ROTULO_TEMPERATURA = 'Temperatura (leitura do Kit de Tecidos)';
  var NOTA_TEMPERATURA = 'A temperatura vem do Kit de Tecidos; o app não a estima.';

  function opcaoTemperatura(valor, titulo, sub, atual) {
    var selecionada = atual === valor;
    return '<button type="button" class="opcao' + (selecionada ? ' selecionada' : '') +
      '" data-temperatura="' + esc(valor) + '" aria-pressed="' + (selecionada ? 'true' : 'false') + '">' +
      '<span class="opcao-marca" aria-hidden="true"></span>' +
      '<span class="opcao-texto"><span class="opcao-titulo">' + esc(titulo) + '</span>' +
      '<small class="opcao-sub">' + esc(sub) + '</small></span>' +
      '</button>';
  }

  function controlesDeTemperatura(temperatura) {
    return '<div class="opcoes" role="group" aria-label="' + esc(ROTULO_TEMPERATURA) + '">' +
        opcaoTemperatura('fria', 'Fria', 'Leitura do kit: a pele pede temperatura fria', temperatura) +
        opcaoTemperatura('neutra', 'Neutra', 'Sem predominância: usa a família de menor contraste térmico do par', temperatura) +
        opcaoTemperatura('quente', 'Quente', 'Leitura do kit: a pele pede temperatura quente', temperatura) +
      '</div>' +
      '<p class="texto-suave">' + esc(NOTA_TEMPERATURA) + '</p>';
  }

  function render10(el, ctx) {
    var e = ctx.estado || {};
    var temperatura = temperaturaDe(e);
    /* Deriva sempre da leitura registrada: família cacheada no estado não pinta este painel. */
    var familia = MOTOR.familiaPrescrita(e.profundidade, e.temperatura);
    if (familia && e.familia !== familia.sigla) e.familia = familia.sigla;
    sincronizar(e, ctx); /* grave a família derivada e o teto no prontuário */
    var rotulos = rotulosDaRota(e.rota);
    var indicePele = MOTOR.indiceProfundidade(e.profundidade);
    var calibracao = (e.contraste === 'baixo' || e.contraste === 'medio' || e.contraste === 'alto')
      ? calibracaoPorContraste(e.contraste)
      : null;

    var secao = '<h2>Família e calibração</h2>' +
      '<p class="lead">Calculado a partir do que você registrou. Você confirma — este é o primeiro ponto de validação.</p>';

    if (familia) {
      secao +=
        '<div class="painel-ajuste"><div class="linhas-leitura">' +
          linha(rotulos.familia, familia.nome + ' · ' + familia.sigla) +
          linha(rotulos.calibracao, calibracao || '—') +
          linha('Profundidade × temperatura', leituraTexto(e)) +
          linha('Contraste', e.contraste ? ROTULO_NIVEL[e.contraste] : '—') +
        '</div></div>' +
        '<div class="cartao cartao-calculo">' +
          '<p class="rotulo">' + esc(ROTULO_TEMPERATURA) + '</p>' +
          controlesDeTemperatura(temperatura) +
        '</div>';
    } else {
      secao +=
        '<div class="cartao cartao-calculo">' +
          '<p class="rotulo">Família ainda não definida</p>' +
          '<p class="texto">A família cruza profundidade × temperatura. ' +
            (indicePele
              ? 'A profundidade está registrada; falta a temperatura lida no Kit de Tecidos.'
              : 'Faltam a profundidade da pele (tela 4) e a temperatura lida no Kit de Tecidos.') +
          '</p>' +
          '<p class="texto">Sem temperatura registrada não há família a derivar.</p>' +
          '<p class="rotulo">' + esc(ROTULO_TEMPERATURA) + '</p>' +
          controlesDeTemperatura(temperatura) +
        '</div>';
    }

    secao +=
      '<div class="nota"><b>Nomenclatura (RN-24):</b> o rótulo muda com a rota. Na Rota Estilo a cor é <b>proposta</b> — chamar de prescrita seria erro conceitual.</div>';

    el.innerHTML = secao;

    Array.prototype.forEach.call(el.querySelectorAll('[data-temperatura]'), function (botao) {
      botao.addEventListener('click', function () {
        e.temperatura = botao.getAttribute('data-temperatura');
        var derivada = MOTOR.familiaPrescrita(e.profundidade, e.temperatura);
        if (derivada) e.familia = derivada.sigla;
        var teto = tetoDoEstado(e);
        if (teto !== null) e.teto = teto;
        recarregarCom(ctx);
      });
    });
  }

  /* ---------- TELA 11 ---------- */

  function render11(el, ctx) {
    var e = ctx.estado || {};
    var estadoSin = sincronizar(e, ctx);
    var familia = estadoSin.familia;
    var teto = estadoSin.teto;
    var viaveis = (familia && teto !== null) ? MOTOR.amostrasViaveis(familia, teto) : [];

    var caminho;
    if (!familia || teto === null) {
      caminho = 'Faltam a família e o teto para decidir o caminho desta tela.';
    } else if (viaveis.length) {
      caminho = viaveis.length + (viaveis.length === 1 ? ' amostra da família cabe' : ' amostras da família cabem') +
        ' no teto — o Continuar leva à escolha da amostra.';
    } else {
      caminho = 'Nenhuma amostra da família cabe no teto — o Continuar leva à declaração do conflito.';
    }

    el.innerHTML =
      '<h2>Teto e faixa</h2>' +
      '<p class="lead">O que a pele pede e o que o fio alcança hoje. O app compara e mostra; quem decide é você.</p>' +
      '<div class="painel-ajuste"><div class="linhas-leitura">' +
        linha('Base natural', MOTOR.alturaDeMercado(e.baseNatural) ? hh(e.baseNatural) : '—') +
        linha('Teto de clareamento', teto === null ? '—' : hh(teto)) +
        linha('Faixa da família', familia ? faixaTexto(familia) : '—') +
      '</div></div>' +
      '<p class="lead-destaque">A altura cede, a temperatura não.</p>' +
      '<div class="nota"><b>Caminho desta tela:</b> ' + esc(caminho) + '</div>';
  }

  /* ---------- TELA 12 ---------- */

  function render12(el, ctx) {
    var e = ctx.estado || {};
    var estadoSin = sincronizar(e, ctx);
    var familia = estadoSin.familia;
    var teto = estadoSin.teto;
    var decisao = e.decisaoConflito && DECISOES[e.decisaoConflito.escolha] ? e.decisaoConflito : null;

    instalarGuarda();
    estadoMontado = e;

    var opcoes = Object.keys(DECISOES).map(function (chave) {
      var ativa = !!decisao && decisao.escolha === chave;
      return '<button type="button" class="opcao' + (ativa ? ' selecionada' : '') + '"' +
        ' data-decisao="' + esc(chave) + '" aria-pressed="' + (ativa ? 'true' : 'false') + '">' +
        '<span class="opcao-marca" aria-hidden="true"></span>' +
        '<span class="opcao-texto"><span class="opcao-titulo">' + esc(DECISOES[chave]) + '</span></span>' +
        '</button>';
    }).join('');

    var statusDecisao = decisao
      ? 'Decisão registrada em ' + formatarData(decisao.data) + '.'
      : 'Decisão pendente — o Continuar fica bloqueado até você registrar.';

    el.innerHTML =
      '<h2>Conflito e decisão</h2>' +
      '<p class="lead">Nenhuma amostra da família cabe no teto de clareamento. O app mostra o conflito e não decide.</p>' +
      '<div class="painel-ajuste"><div class="linhas-leitura">' +
        linha('A pele pede', familia
          ? familia.nome + ' · ' + familia.sigla + ' · altura ' + faixaTexto(familia)
          : '—') +
        linha('O fio alcança hoje', teto === null ? '—' : 'até ' + hh(teto)) +
        linha('Situação', 'conflito declarado') +
      '</div></div>' +
      '<p class="rotulo">Decisão da profissional</p>' +
      '<div class="opcoes">' + opcoes + '</div>' +
      '<p class="estado-desejo' + (decisao ? ' estado-desejo-ativo' : '') + '" role="status">' + esc(statusDecisao) + '</p>' +
      '<div class="nota"><b>RN-20.</b> A decisão é registrada com data e hora e aparece no prontuário.</div>' +
      '<div data-tela-prescricao="12" hidden aria-hidden="true"></div>';

    Array.prototype.forEach.call(el.querySelectorAll('[data-decisao]'), function (botao) {
      botao.addEventListener('click', function () {
        registrarDecisao(e, botao.getAttribute('data-decisao'));
        recarregarCom(ctx);
      });
    });
  }

  /* ---------- TELA 13 ---------- */

  function render13(el, ctx) {
    var e = ctx.estado || {};
    var estadoSin = sincronizar(e, ctx);
    var familia = estadoSin.familia;
    var teto = estadoSin.teto;
    var amostras = (familia && teto !== null) ? MOTOR.amostrasViaveis(familia, teto) : [];
    var escolhida = e.amostraEscolhida ? e.amostraEscolhida.codigo : null;

    instalarGuarda();
    estadoMontado = e;

    var cabecalho =
      '<h2>Escolha da amostra</h2>' +
      '<p class="lead">Quem escolhe é ela, com a amostra na mão. Aqui ficam só as amostras da família que cabem no teto.</p>';

    var corpo;
    if (!amostras.length) {
      corpo =
        '<div class="cartao cartao-calculo">' +
          '<p class="rotulo">Nenhuma amostra viável</p>' +
          '<p class="texto">' + (familia && teto !== null
            ? 'Nenhuma amostra de ' + esc(familia.nome + ' · ' + familia.sigla) + ' cabe no teto ' + esc(hh(teto)) + '.'
            : 'Faltam a família e o teto para filtrar as amostras.') + '</p>' +
          '<p class="texto-suave">O app não substitui a família e não recalcula o teto. Volte e confira o conflito antes de escolher.</p>' +
        '</div>';
    } else {
      var grade = amostras.map(function (amostra) {
        var ativa = escolhida === amostra.codigo;
        return '<button type="button" class="opcao' + (ativa ? ' selecionada' : '') + '"' +
          ' data-amostra="' + esc(amostra.codigo) + '" aria-pressed="' + (ativa ? 'true' : 'false') + '">' +
          '<span class="opcao-marca" aria-hidden="true"></span>' +
          '<span class="opcao-texto">' +
            '<span class="linha-rotulo">' +
              '<span class="amostra-cor" aria-hidden="true" style="display:inline-block;width:26px;height:26px;border-radius:8px;border:1px solid rgba(0,0,0,.14);background:' + esc(amostra.hex) + '"></span>' +
              '<span class="opcao-titulo">' + esc(amostra.nome) + '</span>' +
              '<span class="selo">' + esc(hh(amostra.altura)) + '</span>' +
            '</span>' +
            '<small class="opcao-sub">Código ' + esc(amostra.codigo) + ' · altura ' + esc(hh(amostra.altura)) + '</small>' +
          '</span>' +
          '</button>';
      }).join('');

      corpo =
        '<p class="lead-destaque">' + esc(amostras.length + (amostras.length === 1 ? ' amostra' : ' amostras') +
          ' de ' + familia.nome + ' · ' + familia.sigla + ' dentro do teto ' + hh(teto) + '.') + '</p>' +
        '<div class="grade grade-3">' + grade + '</div>' +
        '<p class="estado-desejo' + (escolhida ? ' estado-desejo-ativo' : '') + '" role="status">' +
          (escolhida ? 'Amostra escolhida: ' + esc(escolhida) + '.' : 'Escolha pendente — o Continuar fica bloqueado até a seleção.') +
        '</p>';
    }

    el.innerHTML = cabecalho + corpo +
      '<div class="nota"><b>cor de tela é direção;</b> a decisão se confirma com a amostra na mão.</div>' +
      '<div data-tela-prescricao="13" hidden aria-hidden="true"></div>';

    Array.prototype.forEach.call(el.querySelectorAll('[data-amostra]'), function (botao) {
      botao.addEventListener('click', function () {
        registrarAmostra(e, botao.getAttribute('data-amostra'));
        recarregarCom(ctx);
      });
    });
  }

  /* ---------- registro ---------- */

  if (VISAGE) {
    VISAGE.registrarTela(10, { titulo: 'Família e calibração', bloco: 'prescricao', render: render10 });
    VISAGE.registrarTela(11, { titulo: 'Teto e faixa', bloco: 'prescricao', render: render11 });
    VISAGE.registrarTela(12, { titulo: 'Conflito e decisão', bloco: 'prescricao', render: render12 });
    VISAGE.registrarTela(13, { titulo: 'Escolha da amostra', bloco: 'prescricao', render: render13 });
  }

  return {
    familiaPrescrita: familiaPrescrita,
    calibracaoPorContraste: calibracaoPorContraste,
    rotulosDaRota: rotulosDaRota,
    tetoDoEstado: tetoDoEstado,
    amostrasDaTela13: amostrasDaTela13,
    registrarDecisao: registrarDecisao,
    registrarAmostra: registrarAmostra,
    validarAvancar: validarAvancar,
    decisoes: function () {
      return Object.keys(DECISOES).map(function (chave) {
        return { id: chave, rotulo: DECISOES[chave] };
      });
    }
  };
});
