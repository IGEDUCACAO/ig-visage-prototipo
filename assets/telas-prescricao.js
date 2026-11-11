/* Telas 10 a 13 — bloco D · Prescrição.
   Família (profundidade × temperatura), teto × faixa, conflito e escolha da amostra.
   O que a spec não define aparece como pendência explícita — nada é inventado. */
(function (root) {
  'use strict';

  if (typeof window === 'undefined') return;

  var DADOS = root.VISAGE_DATA;
  var MOTOR = root.VISAGE_ENGINE;

  var VISAGE = root.VISAGE = root.VISAGE || {};
  VISAGE.telas = VISAGE.telas || {};
  if (typeof VISAGE.registrarTela !== 'function') {
    VISAGE.registrarTela = function (n, definicao) { VISAGE.telas[n] = definicao; };
  }

  var PROFUNDIDADES = { clara: 'Clara', media: 'Média', profunda: 'Profunda' };
  var NIVEIS = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' };

  var TEMPERATURAS = [
    { id: 'fria', nome: 'Fria' },
    { id: 'neutra', nome: 'Neutra' },
    { id: 'quente', nome: 'Quente' }
  ];

  var DECISOES = [
    { id: 'entregar-ponto-mais-alto', titulo: 'Entregar o ponto mais alto que o fio suporta (mantendo a temperatura da família)' },
    { id: 'adiar-cor', titulo: 'Adiar a cor e tratar o fio primeiro' }
  ];

  /* ---------- helpers de UI (mesmo padrão das telas 1 a 9) ---------- */

  function esc(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  function opcao(valor, titulo, sub, selecionado) {
    return '<button type="button" class="opcao" data-valor="' + esc(valor) + '"' +
      ' aria-pressed="' + (selecionado ? 'true' : 'false') + '">' +
      '<span class="opcao-marca" aria-hidden="true"></span>' +
      '<span class="opcao-texto"><span class="opcao-titulo">' + esc(titulo) + '</span>' +
      (sub ? '<small class="opcao-sub">' + esc(sub) + '</small>' : '') +
      '</span></button>';
  }

  function ligarOpcoes(raiz, seletor, aoEscolher) {
    Array.prototype.forEach.call(raiz.querySelectorAll(seletor), function (botao) {
      botao.addEventListener('click', function () {
        aoEscolher(botao.getAttribute('data-valor'), botao);
      });
    });
  }

  function ligarIr(raiz, ctx) {
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-ir]'), function (botao) {
      botao.addEventListener('click', function () {
        ctx.irPara(Number(botao.getAttribute('data-ir')));
      });
    });
  }

  function avancarCom(ctx) {
    ctx.salvar();
    ctx.recarregar();
  }

  function linha(rotulo, valor, vazio) {
    return '<div class="linha-leitura' + (vazio ? ' linha-vazia' : '') + '">' +
      '<span class="linha-rotulo-texto">' + esc(rotulo) + '</span>' +
      '<span class="linha-valor">' + esc(valor) + '</span>' +
      '</div>';
  }

  function cartaoPendencia(titulo, texto, destino, rotuloAcao) {
    return '<section class="cartao cartao-alerta" role="alert">' +
      '<h3>' + esc(titulo) + '</h3>' +
      '<p class="texto">' + esc(texto) + '</p>' +
      '<button type="button" class="btn btn-secundario" data-ir="' + destino + '">' + esc(rotuloAcao) + '</button>' +
      '</section>';
  }

  /* ---------- derivações compartilhadas ---------- */

  function familiaDoEstado(e) {
    return DADOS.familiaPorSigla(e.familia) || MOTOR.familiaPrescrita(e.profundidade, e.temperatura);
  }

  function faixaDaFamilia(familia) {
    if (!familia || !Array.isArray(familia.faixa)) return '—';
    return DADOS.formatarAltura(familia.faixa[0]) + '–' + DADOS.formatarAltura(familia.faixa[1]);
  }

  /* RN-24: "prescrita" só vale para Harmonia e Íris; na Rota Estilo a família é proposta. */
  function rotuloDaFamilia(rota) {
    return rota === 'estilo' ? 'Família proposta' : 'Família prescrita';
  }

  function tituloDaDecisao(id) {
    for (var i = 0; i < DECISOES.length; i++) {
      if (DECISOES[i].id === id) return DECISOES[i].titulo;
    }
    return id;
  }

  /* ---------- TELA 10 — Família e calibração ---------- */

  function render10(el, ctx) {
    var e = ctx.estado;

    if (MOTOR.indiceProfundidade(e.profundidade) === null) {
      el.innerHTML =
        '<h2>Família e calibração</h2>' +
        '<p class="lead">A família cruza a profundidade da pele com a temperatura.</p>' +
        cartaoPendencia(
          'Falta a profundidade da pele',
          'A família depende da profundidade registrada na tela 4 — o app não a estima aqui.',
          4,
          'Ir para a profundidade da pele'
        );
      ligarIr(el, ctx);
      return;
    }

    /* O shell descarta campos que não conhece ao recarregar; a temperatura se
       recupera da família persistida, sem perguntar de novo à profissional. */
    if (!e.temperatura && e.familia) {
      var persistida = DADOS.familiaPorSigla(e.familia);
      if (persistida) e.temperatura = persistida.temperatura;
    }

    var familia = MOTOR.familiaPrescrita(e.profundidade, e.temperatura);
    var profundidadeRotulo = PROFUNDIDADES[e.profundidade] || e.profundidade;
    var contrasteFaltando = ['baixo', 'medio', 'alto'].indexOf(e.contraste) === -1;
    var calibracao = contrasteFaltando ? null : MOTOR.calibracaoDeContraste(e.contraste);

    /* Se a profundidade mudou depois da leitura, a família persistida fica velha:
       sincroniza aqui e descarta as decisões que dependiam da família anterior. */
    if (familia && e.familia !== familia.sigla) {
      e.familia = familia.sigla;
      e.teto = null;
      e.decisaoConflito = null;
      e.amostraEscolhida = null;
    }

    var temperaturaHtml = TEMPERATURAS.map(function (t) {
      return opcao(t.id, t.nome, '', e.temperatura === t.id);
    }).join('');

    var painelHtml = '';
    if (familia) {
      painelHtml =
        '<section class="painel-prescricao" aria-labelledby="tituloFamilia">' +
          '<p class="sobretitulo" id="tituloFamilia">' + esc(rotuloDaFamilia(e.rota)) + '</p>' +
          '<div class="familia-cabeca">' +
            '<span class="familia-sigla">' + esc(familia.sigla) + '</span>' +
            '<span class="familia-nome">' + esc(familia.nome) + '</span>' +
          '</div>' +
          '<div class="linhas-leitura">' +
            linha('Calibração', calibracao || 'aguardando o contraste da tela 6', !calibracao) +
            linha('Profundidade · temperatura', profundidadeRotulo.toLowerCase() + ' · ' + e.temperatura) +
            linha('Contraste', contrasteFaltando ? 'não confirmado' : NIVEIS[e.contraste], contrasteFaltando) +
            linha('Faixa da família', faixaDaFamilia(familia)) +
          '</div>' +
        '</section>' +
        (contrasteFaltando
          ? '<button type="button" class="btn btn-secundario btn-largo" data-ir="6">Revisar o contraste (tela 6)</button>'
          : '');
    } else {
      painelHtml =
        '<p class="hint">Sem temperatura registrada não há família a derivar. Escolha a leitura do Kit de Tecidos acima.</p>';
    }

    el.innerHTML =
      '<h2>Família e calibração</h2>' +
      '<p class="lead">A família nasce da profundidade da pele somada à temperatura. A calibração vem do contraste já confirmado.</p>' +
      '<p class="profundidade-atual">Profundidade: <b>' + esc(profundidadeRotulo) + '</b></p>' +
      '<p class="rotulo">Temperatura (leitura do Kit de Tecidos)</p>' +
      '<div class="grade grade-3">' + temperaturaHtml + '</div>' +
      painelHtml +
      '<div class="nota">A temperatura vem do Kit de Tecidos; o app não a estima.</div>';

    ligarIr(el, ctx);

    ligarOpcoes(el, '[data-valor]', function (valor) {
      e.temperatura = valor;
      var nova = MOTOR.familiaPrescrita(e.profundidade, valor);
      var novaSigla = nova ? nova.sigla : null;
      if (e.familia !== novaSigla) {
        e.familia = novaSigla;
        e.teto = null;
        e.decisaoConflito = null;
        e.amostraEscolhida = null;
      }
      avancarCom(ctx);
    });
  }

  /* ---------- TELA 11 — Teto e faixa ---------- */

  function render11(el, ctx) {
    var e = ctx.estado;
    var familia = familiaDoEstado(e);

    if (!familia) {
      el.innerHTML =
        '<h2>Teto e faixa</h2>' +
        '<p class="lead">O teto limita até onde a altura pode subir; a temperatura da família não muda.</p>' +
        cartaoPendencia(
          'Falta a família',
          'A faixa da família depende da profundidade e da temperatura registradas na tela 10.',
          10,
          'Ir para a família e calibração'
        );
      ligarIr(el, ctx);
      return;
    }

    if (!MOTOR.alturaDeMercado(e.baseNatural)) {
      el.innerHTML =
        '<h2>Teto e faixa</h2>' +
        '<p class="lead">O teto de clareamento parte da base natural registrada na tela 5.</p>' +
        cartaoPendencia(
          'Falta a base natural',
          'Sem a altura da base natural não há como calcular o teto de degraus do fio.',
          5,
          'Ir para a base natural'
        );
      ligarIr(el, ctx);
      return;
    }

    var teto = MOTOR.tetoDeClareamento(e.baseNatural, familia.tetoClareamento);
    var viaveis = MOTOR.amostrasViaveis(familia, e.baseNatural, familia.tetoClareamento);
    var alcance = MOTOR.faixaAlcancavel(familia, e.baseNatural, familia.tetoClareamento);

    /* O roteamento da tela 11 (app.js) usa estado.teto: mantém o mesmo teto aqui. */
    e.teto = teto;

    var proximo = viaveis.length
      ? 'Próximo passo: escolha da amostra — ' + viaveis.length +
        (viaveis.length === 1 ? ' amostra viável.' : ' amostras viáveis.')
      : 'Próximo passo: conflito e decisão — nenhuma amostra da família ' + faixaDaFamilia(familia) +
        ' cabe no teto de hoje.';

    el.innerHTML =
      '<h2>Teto e faixa</h2>' +
      '<p class="lead">Aqui o que a pele pede encontra o que o fio alcança hoje.</p>' +
      '<section class="painel-prescricao" aria-labelledby="tituloTeto">' +
        '<p class="sobretitulo" id="tituloTeto">' + esc(familia.nome) + ' · ' + esc(familia.sigla) + '</p>' +
        '<p class="destaque-regra">A altura cede, a temperatura não.</p>' +
        '<div class="linhas-leitura">' +
          linha('Base natural', DADOS.formatarAltura(e.baseNatural)) +
          linha('Teto de clareamento', 'até a altura ' + DADOS.formatarAltura(teto)) +
          linha('Faixa da família', faixaDaFamilia(familia)) +
          linha('Faixa alcançável hoje', alcance) +
        '</div>' +
      '</section>' +
      '<p class="hint">' + esc(proximo) + '</p>' +
      '<div class="nota"><b>Roteamento condicional (spec 2.4):</b> havendo ao menos uma amostra da família dentro do teto, o fluxo segue para a escolha da amostra; sem nenhuma, segue para o conflito e decisão.</div>';
  }

  /* ---------- TELA 12 — Conflito e decisão ---------- */

  function render12(el, ctx) {
    var e = ctx.estado;
    var familia = familiaDoEstado(e);

    if (!familia) {
      el.innerHTML =
        '<h2>Conflito e decisão</h2>' +
        cartaoPendencia(
          'Falta a família',
          'O conflito compara a faixa da família com o teto do fio definidos nas telas 10 e 11.',
          10,
          'Ir para a família e calibração'
        );
      ligarIr(el, ctx);
      return;
    }

    if (!MOTOR.alturaDeMercado(e.baseNatural)) {
      el.innerHTML =
        '<h2>Conflito e decisão</h2>' +
        cartaoPendencia(
          'Falta a base natural',
          'O teto do fio parte da base natural registrada na tela 5.',
          5,
          'Ir para a base natural'
        );
      ligarIr(el, ctx);
      return;
    }

    var teto = MOTOR.tetoDeClareamento(e.baseNatural, familia.tetoClareamento);
    var viaveis = MOTOR.amostrasViaveis(familia, e.baseNatural, familia.tetoClareamento);

    /* Telas 12 e 13 são mutuamente exclusivas (spec 2.4). */
    if (viaveis.length) {
      el.innerHTML =
        '<h2>Conflito e decisão</h2>' +
        '<section class="cartao cartao-alerta" role="status">' +
          '<h3>Esta tela não se aplica</h3>' +
          '<p class="texto">Há ' + viaveis.length +
            (viaveis.length === 1 ? ' amostra da família dentro' : ' amostras da família dentro') +
            ' do teto de hoje: a situação é de escolha, não de conflito.</p>' +
          '<button type="button" class="btn btn-secundario" data-ir="13">Ir para a escolha da amostra</button>' +
        '</section>';
      ligarIr(el, ctx);
      return;
    }

    var decisoesHtml = DECISOES.map(function (d) {
      var ativa = !!e.decisaoConflito && e.decisaoConflito.escolha === d.id;
      return opcao(d.id, d.titulo, '', ativa);
    }).join('');

    var registro = '';
    if (e.decisaoConflito && tituloDaDecisao(e.decisaoConflito.escolha)) {
      registro =
        '<div class="registro-prescricao">' +
          '<p><b>Decisão registrada (RN-20):</b> ' + esc(tituloDaDecisao(e.decisaoConflito.escolha)) + '</p>' +
          '<p><b>Data:</b> ' + esc(formatarData(e.decisaoConflito.data)) + '</p>' +
        '</div>';
    }

    el.innerHTML =
      '<h2>Conflito e decisão</h2>' +
      '<p class="lead">Nenhuma amostra da família cabe no teto de hoje. A decisão é da profissional e fica registrada.</p>' +
      '<section class="painel-prescricao painel-conflito" aria-labelledby="tituloConflito">' +
        '<p class="sobretitulo" id="tituloConflito">Conflito declarado</p>' +
        '<div class="linhas-leitura">' +
          linha('A pele pede', familia.nome + ' · ' + faixaDaFamilia(familia)) +
          linha('O fio alcança hoje', 'até a altura ' + DADOS.formatarAltura(teto)) +
          linha('Situação', 'conflito declarado') +
        '</div>' +
      '</section>' +
      '<p class="rotulo">Decisão da profissional (obrigatória)</p>' +
      '<div class="opcoes">' + decisoesHtml + '</div>' +
      registro +
      '<div class="nota"><b>RN-20:</b> a decisão entra no prontuário com data. A temperatura da família não muda nesta escolha.</div>';

    ligarOpcoes(el, '[data-valor]', function (valor) {
      e.decisaoConflito = { escolha: valor, data: new Date().toISOString() };
      avancarCom(ctx);
    });
  }

  /* ---------- TELA 13 — Escolha da amostra ---------- */

  function renderLacuna(el, ctx, familia) {
    var e = ctx.estado;
    var registrado = e.amostraEscolhida && e.amostraEscolhida.manual ? e.amostraEscolhida : null;

    el.innerHTML =
      '<h2>Escolha da amostra</h2>' +
      '<section class="cartao cartao-lacuna" aria-labelledby="tituloLacuna">' +
        '<p class="sobretitulo">Lacuna na matriz de paletas</p>' +
        '<h3 id="tituloLacuna">A matriz ainda não tem amostras para ' + esc(familia.nome) + '</h3>' +
        '<p class="texto">Sem amostra cadastrada não há tom a exibir — o app não inventa tom. A matriz precisa ser preenchida pela equipe do método.</p>' +
        '<p class="texto-suave">Até lá, dá para seguir com o registro manual do tom escolhido na bancada.</p>' +
      '</section>' +
      '<div class="campo">' +
        '<label class="rotulo" for="tomManual">Tom escolhido (código ou descrição)</label>' +
        '<input type="text" id="tomManual" autocomplete="off" value="' + esc(registrado ? registrado.descricao : '') + '" placeholder="Ex.: 7.1 da marca usada na bancada">' +
      '</div>' +
      '<p class="erro" id="erroTomManual" role="alert" hidden></p>' +
      '<button type="button" class="btn btn-secundario btn-largo" data-acao="registrar-tom">Registrar tom manualmente</button>' +
      (registrado
        ? '<div class="registro-prescricao">' +
            '<p><b>Registro manual:</b> ' + esc(registrado.descricao) + '</p>' +
            '<p><b>Data:</b> ' + esc(formatarData(registrado.data)) + '</p>' +
          '</div>'
        : '') +
      '<div class="nota"><b>Direção, não decisão:</b> cor de tela é direção; a decisão se confirma com a amostra na mão.</div>';

    var botao = el.querySelector('[data-acao="registrar-tom"]');
    var campo = el.querySelector('#tomManual');
    var erro = el.querySelector('#erroTomManual');

    if (botao) {
      botao.addEventListener('click', function () {
        var descricao = campo ? campo.value.trim() : '';
        if (!descricao) {
          if (erro) {
            erro.hidden = false;
            erro.textContent = 'Descreva o tom escolhido na bancada — o registro manual não pode ficar em branco.';
          }
          if (campo) campo.focus();
          return;
        }
        e.amostraEscolhida = { manual: true, descricao: descricao, data: new Date().toISOString() };
        avancarCom(ctx);
      });
    }
  }

  function render13(el, ctx) {
    var e = ctx.estado;
    var familia = familiaDoEstado(e);

    if (!familia) {
      el.innerHTML =
        '<h2>Escolha da amostra</h2>' +
        cartaoPendencia(
          'Falta a família',
          'As amostras são filtradas pela família definida na tela 10.',
          10,
          'Ir para a família e calibração'
        );
      ligarIr(el, ctx);
      return;
    }

    if (!MOTOR.alturaDeMercado(e.baseNatural)) {
      el.innerHTML =
        '<h2>Escolha da amostra</h2>' +
        cartaoPendencia(
          'Falta a base natural',
          'O teto que filtra as amostras parte da base natural registrada na tela 5.',
          5,
          'Ir para a base natural'
        );
      ligarIr(el, ctx);
      return;
    }

    var teto = MOTOR.tetoDeClareamento(e.baseNatural, familia.tetoClareamento);

    /* A matriz não tem amostra para esta família: lacuna explícita, sem inventar tom. */
    if (!familia.amostras.length) {
      renderLacuna(el, ctx, familia);
      return;
    }

    var viaveis = MOTOR.amostrasViaveis(familia, e.baseNatural, familia.tetoClareamento);

    /* Sem amostra viável o caso é da tela 12: esta tela não mostra grade vazia. */
    if (!viaveis.length) {
      el.innerHTML =
        '<h2>Escolha da amostra</h2>' +
        '<section class="cartao cartao-alerta" role="status">' +
          '<h3>Não há amostra viável hoje</h3>' +
          '<p class="texto">Nenhuma amostra da família ' + esc(faixaDaFamilia(familia)) +
            ' está dentro do teto de ' + esc(DADOS.formatarAltura(teto)) + '. Essa situação é resolvida na tela de conflito.</p>' +
          '<button type="button" class="btn btn-secundario" data-ir="12">Ir para o conflito e decisão</button>' +
        '</section>';
      ligarIr(el, ctx);
      return;
    }

    var escolhida = e.amostraEscolhida && !e.amostraEscolhida.manual ? e.amostraEscolhida.codigo : null;
    var grade = viaveis.map(function (amostra) {
      var ativa = escolhida === amostra.codigo;
      return '<button type="button" class="amostra' + (ativa ? ' selecionada' : '') + '"' +
        ' data-amostra="' + esc(amostra.codigo) + '" aria-pressed="' + (ativa ? 'true' : 'false') + '">' +
        '<span class="amostra-cor" style="background-color:' + esc(amostra.hex) + '" aria-hidden="true"></span>' +
        '<span class="amostra-codigo">' + esc(DADOS.formatarAltura(amostra.altura)) + ' · ' + esc(amostra.codigo) + '</span>' +
        '<span class="amostra-nome">' + esc(amostra.nome) + '</span>' +
        '</button>';
    }).join('');

    el.innerHTML =
      '<h2>Escolha da amostra</h2>' +
      '<p class="lead">' + viaveis.length +
        (viaveis.length === 1 ? ' amostra da família cabe' : ' amostras da família cabem') +
        ' no teto de ' + esc(DADOS.formatarAltura(teto)) + ' da base natural. Só elas aparecem.</p>' +
      '<div class="amostras-grade">' + grade + '</div>' +
      '<p class="hint">A altura aparece no código; o quadrado é a direção de cor da matriz de paletas.</p>' +
      '<div class="nota"><b>Direção, não decisão:</b> cor de tela é direção; a decisão se confirma com a amostra na mão.</div>';

    Array.prototype.forEach.call(el.querySelectorAll('[data-amostra]'), function (botao) {
      botao.addEventListener('click', function () {
        var codigo = botao.getAttribute('data-amostra');
        var escolhidaAgora = null;
        for (var i = 0; i < viaveis.length; i++) {
          if (viaveis[i].codigo === codigo) escolhidaAgora = viaveis[i];
        }
        if (!escolhidaAgora) return;
        e.amostraEscolhida = {
          codigo: escolhidaAgora.codigo,
          nome: escolhidaAgora.nome,
          altura: escolhidaAgora.altura,
          hex: escolhidaAgora.hex,
          manual: false
        };
        avancarCom(ctx);
      });
    });
  }

  /* ---------- registro ---------- */

  VISAGE.registrarTela(10, { titulo: 'Família e calibração', bloco: 'prescricao', render: render10 });
  VISAGE.registrarTela(11, { titulo: 'Teto e faixa', bloco: 'prescricao', render: render11 });
  VISAGE.registrarTela(12, { titulo: 'Conflito e decisão', bloco: 'prescricao', render: render12 });
  VISAGE.registrarTela(13, { titulo: 'Escolha da amostra', bloco: 'prescricao', render: render13 });
})(typeof window !== 'undefined' ? window : this);
