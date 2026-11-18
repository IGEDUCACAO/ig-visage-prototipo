/* Shell, navegação e estado do protótipo v2.
   O roteador funciona mesmo quando uma tela ainda não foi registrada:
   nesse caso desenha o cartão "em construção" e bloqueia o avanço. */
(function (root) {
  'use strict';

  if (typeof document === 'undefined') return;

  var DADOS = root.VISAGE_DATA;
  var MOTOR = root.VISAGE_ENGINE;
  var CHAVE = 'visage.v2';
  var VERSAO = 2;

  var VISAGE = root.VISAGE = root.VISAGE || {};
  var telasRegistradas = VISAGE.telas = VISAGE.telas || {};

  var BLOCOS = [
    { id: 'abertura', letra: 'A', nome: 'Abertura' },
    { id: 'leitura', letra: 'B', nome: 'Leitura' },
    { id: 'rosto', letra: 'C', nome: 'Rosto' },
    { id: 'prescricao', letra: 'D', nome: 'Prescrição' },
    { id: 'fechamento', letra: 'E', nome: 'Fechamento' }
  ];

  /* Fluxo oficial ditado pela Ilda, na ordem e com os títulos exatos das 12 telas.
     `tela` é o id com que assets/telas-*.js registra o render daquela tela.
     As telas que saíram do fluxo linear (Regra dos 4 tons, Conflito e decisão,
     Diagnóstico, Manutenção e Paleta) continuam registradas com o seu id. */
  var TELAS = [
    { n: 1, titulo: 'Quem está na cadeira?', bloco: 'abertura', tela: 1 },
    { n: 2, titulo: 'Qual o desejo dela?', bloco: 'abertura', tela: 2 },
    { n: 3, titulo: 'Rota escolhida', bloco: 'abertura', tela: 3 },
    { n: 4, titulo: 'Profundidade da pele', bloco: 'leitura', tela: 4 },
    { n: 5, titulo: 'Base natural do cabelo', bloco: 'leitura', tela: 5 },
    { n: 6, titulo: 'Contraste', bloco: 'leitura', tela: 7 },
    { n: 7, titulo: 'Família', bloco: 'prescricao', tela: 11 },
    { n: 8, titulo: 'Formato do rosto', bloco: 'rosto', tela: 9 },
    { n: 9, titulo: 'O que o seu formato direciona', bloco: 'rosto', tela: 10 },
    { n: 10, titulo: 'Percentual de cabelos brancos', bloco: 'leitura', tela: 6 },
    { n: 11, titulo: 'Como ficou o teste', bloco: 'leitura', tela: 8 },
    { n: 12, titulo: 'Cor final', bloco: 'prescricao', tela: 14 }
  ];

  /* O dossiê continua acessível como etapa 13, fora da contagem das 12 telas. */
  var TELA_DOSSIE = 13;
  var TOTAL_TELAS = TELAS.length + 1;
  var MAX_REGISTRO = 18;

  VISAGE.TELAS = TELAS;

  var elBloco = document.getElementById('blocoAtual');
  var elProgresso = document.getElementById('progresso');
  var elTelaNome = document.getElementById('telaNome');
  var elTelaNum = document.getElementById('telaNum');
  var elTela = document.getElementById('tela');
  var elAviso = document.getElementById('aviso');
  var elMotivo = document.getElementById('rodapeMotivo');
  var elVoltar = document.getElementById('voltar');
  var elAvancar = document.getElementById('avancar');

  var faltando = [];
  [
    ['blocoAtual', elBloco], ['progresso', elProgresso], ['telaNome', elTelaNome],
    ['telaNum', elTelaNum], ['tela', elTela], ['aviso', elAviso],
    ['rodapeMotivo', elMotivo], ['voltar', elVoltar], ['avancar', elAvancar]
  ].forEach(function (par) {
    if (!par[1]) faltando.push(par[0]);
  });
  if (faltando.length) {
    console.error('[visage] Shell incompleto: faltam os elementos #' + faltando.join(', #') + '.');
    return;
  }

  var avisoInicial = '';
  if (!DADOS || !DADOS.ALTURAS) {
    avisoInicial = 'Não foi possível carregar assets/data.js. Recarregue a página.';
  } else if (!MOTOR || !MOTOR.validaEtapa) {
    avisoInicial = 'Não foi possível carregar assets/engine.js. Recarregue a página.';
  } else {
    iniciar();
  }
  if (avisoInicial) {
    elTela.innerHTML = '<section class="cartao cartao-erro" role="alert"><h2>Falha ao carregar o protótipo</h2><p class="texto">' + escapar(avisoInicial) + '</p><p class="texto-suave">Os arquivos precisam ser servidos por HTTP a partir da raiz do projeto (o GitHub Pages faz isso).</p></section>';
    elAvancar.disabled = true;
    elMotivo.textContent = avisoInicial;
    return;
  }

  function iniciar() {
    var sessao = carregarSessao();
    var estado = sessao.estado || estadoInicial();
    var telaAtual = sessao.telaAtual;
    var trilha = sessao.trilha;
    var aviso = sessao.aviso || '';
    var falhaSalvarAvisada = false;
    var rolarParaTopo = true;

    montarProgresso();
    elVoltar.addEventListener('click', voltar);
    elAvancar.addEventListener('click', avancar);

    VISAGE.telas = telasRegistradas;
    VISAGE.registrarTela = registrarTela;
    VISAGE.irPara = irPara;
    VISAGE.estado = estado;
    VISAGE.salvar = salvar;
    VISAGE.reiniciar = reiniciar;

    render();

    /* ---------- estado ---------- */

    function hojeISO() {
      var agora = new Date();
      var mes = String(agora.getMonth() + 1).padStart(2, '0');
      var dia = String(agora.getDate()).padStart(2, '0');
      return agora.getFullYear() + '-' + mes + '-' + dia;
    }

    function estadoInicial() {
      return {
        cliente: null,
        desejo: null,
        rota: null,
        rotaRotulo: null,
        profundidade: null,
        baseNatural: null,
        contraste: null,
        contrasteAjuste: null,
        saudeFio: null,
        formatoRosto: null,
        estatura: null,
        brancos: null,
        brancosObs: null,
        corCosmetica: null,
        familia: null,
        teto: null,
        tetoDescricao: null,
        corFinalLivre: null,
        dataAtendimento: hojeISO()
      };
    }

    function sanitizarEstado(bruto) {
      if (!bruto || typeof bruto !== 'object') return null;
      var limpo = estadoInicial();

      if (bruto.cliente && typeof bruto.cliente === 'object' &&
          typeof bruto.cliente.nome === 'string' && typeof bruto.cliente.contato === 'string') {
        limpo.cliente = { nome: bruto.cliente.nome, contato: bruto.cliente.contato };
      }
      if (typeof bruto.desejo === 'string' && bruto.desejo.length) limpo.desejo = bruto.desejo;

      var indices = [null, 'clara', 'media', 'profunda'];
      var iPele = MOTOR.indiceProfundidade(bruto.profundidade);
      if (iPele) limpo.profundidade = indices[iPele];

      var baseSalva = Number(bruto.baseNatural);
      if (DADOS.ALTURAS.indexOf(baseSalva) !== -1) limpo.baseNatural = baseSalva;

      if (['baixo', 'medio', 'alto'].indexOf(bruto.contraste) !== -1) limpo.contraste = bruto.contraste;

      if (bruto.contrasteAjuste && typeof bruto.contrasteAjuste === 'object' &&
          ['baixo', 'medio', 'alto'].indexOf(bruto.contrasteAjuste.nivel) !== -1 &&
          typeof bruto.contrasteAjuste.justificativa === 'string' &&
          bruto.contrasteAjuste.justificativa.trim()) {
        limpo.contrasteAjuste = {
          nivel: bruto.contrasteAjuste.nivel,
          justificativa: bruto.contrasteAjuste.justificativa,
          data: typeof bruto.contrasteAjuste.data === 'string' ? bruto.contrasteAjuste.data : new Date().toISOString()
        };
      }

      if (['harmonia', 'iris', 'estilo'].indexOf(bruto.rota) !== -1) {
        limpo.rota = bruto.rota;
        limpo.rotaRotulo = bruto.rota === 'estilo' ? 'proposta' : 'prescrita';
      }

      if (['comporta', 'comprometido', 'sem'].indexOf(bruto.saudeFio) !== -1) limpo.saudeFio = bruto.saudeFio;

      if (DADOS.formatoPorId(bruto.formatoRosto)) limpo.formatoRosto = bruto.formatoRosto;

      var familia = DADOS.familiaPorSigla(bruto.familia);
      if (familia) limpo.familia = familia.sigla;

      if (typeof bruto.brancos === 'string' &&
          ['nenhum', 'poucos', 'metade', 'maioria', 'quase-tudo'].indexOf(bruto.brancos) !== -1) {
        limpo.brancos = bruto.brancos;
      }
      if (typeof bruto.estatura === 'string' && ['baixa', 'media', 'alta'].indexOf(bruto.estatura) !== -1) {
        limpo.estatura = bruto.estatura;
      }
      ['brancosObs', 'corCosmetica', 'tetoDescricao', 'corFinalLivre'].forEach(function (chave) {
        if (typeof bruto[chave] === 'string' && bruto[chave].trim()) {
          limpo[chave] = bruto[chave].trim().slice(0, 600);
        }
      });

      var teto = Number(bruto.teto);
      if (Number.isInteger(teto) && DADOS.ALTURAS.indexOf(teto) !== -1) limpo.teto = teto;

      if (typeof bruto.dataAtendimento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(bruto.dataAtendimento)) {
        limpo.dataAtendimento = bruto.dataAtendimento;
      }

      return limpo;
    }

    function carregarSessao() {
      var padrao = { estado: null, telaAtual: 1, trilha: [1], aviso: '' };
      var bruto;
      try {
        bruto = root.localStorage.getItem(CHAVE);
      } catch (err) {
        console.warn('[visage] localStorage indisponível; o prontuário fica só nesta aba.', err);
        return padrao;
      }
      if (!bruto) return padrao;

      var pacote;
      try {
        pacote = JSON.parse(bruto);
      } catch (err) {
        console.warn('[visage] Sessão salva ilegível; começando um prontuário novo.', err);
        padrao.aviso = 'A sessão salva estava corrompida e foi descartada. Começando um prontuário novo.';
        return padrao;
      }

      if (!pacote || pacote.v !== VERSAO) {
        padrao.aviso = 'A sessão salva era de outra versão do protótipo e foi ignorada. Começando um prontuário novo.';
        return padrao;
      }

      var limpo = sanitizarEstado(pacote.estado);
      if (!limpo) {
        padrao.aviso = 'O prontuário salvo não tinha o formato esperado e foi descartado.';
        return padrao;
      }

      var tela = Number(pacote.telaAtual);
      if (!Number.isInteger(tela) || tela < 1 || tela > TOTAL_TELAS) tela = 1;

      var trilha = Array.isArray(pacote.trilha) ? pacote.trilha.filter(function (n) {
        return Number.isInteger(n) && n >= 1 && n <= TOTAL_TELAS;
      }) : [];
      if (!trilha.length || trilha[trilha.length - 1] !== tela) trilha = [tela];

      return { estado: limpo, telaAtual: tela, trilha: trilha, aviso: '' };
    }

    function salvar() {
      try {
        root.localStorage.setItem(CHAVE, JSON.stringify({
          v: VERSAO,
          estado: estado,
          telaAtual: telaAtual,
          trilha: trilha
        }));
        return true;
      } catch (err) {
        console.warn('[visage] Não foi possível salvar no localStorage.', err);
        if (!falhaSalvarAvisada) {
          falhaSalvarAvisada = true;
          aviso = 'Não foi possível salvar no armazenamento local. O prontuário segue nesta aba, mas se perde ao fechar.';
          renderAviso();
        }
        return false;
      }
    }

    function reiniciar() {
      estado = estadoInicial();
      VISAGE.estado = estado;
      telaAtual = 1;
      trilha = [1];
      aviso = 'Demonstração reiniciada: o prontuário foi apagado.';
      try {
        root.localStorage.removeItem(CHAVE);
      } catch (err) {
        console.warn('[visage] Não foi possível limpar o localStorage.', err);
      }
      salvar();
      rolarParaTopo = true;
      render();
    }

    function registrarTela(n, definicao) {
      var numero = Number(n);
      if (!Number.isInteger(numero) || numero < 1 || numero > MAX_REGISTRO) {
        throw new Error('Tela inválida para registro: ' + n);
      }
      if (!definicao || typeof definicao.render !== 'function') {
        throw new Error('A tela ' + numero + ' precisa de um render(el, ctx).');
      }
      telasRegistradas[numero] = definicao;
    }

    /* ---------- roteamento ---------- */

    function metaDaTela(n) {
      if (n === TELA_DOSSIE) return { titulo: 'Dossiê final', bloco: 'fechamento', tela: 18 };
      return TELAS[n - 1] || null;
    }

    function blocoPorId(id) {
      for (var i = 0; i < BLOCOS.length; i++) {
        if (BLOCOS[i].id === id) return BLOCOS[i];
      }
      return BLOCOS[0];
    }

    function familiaDoEstado(e) {
      return DADOS.familiaPorSigla(e.familia) || null;
    }

    /* Roteador das telas 12 (Regra dos 4 tons) e 13 (Conflito), que saíram do
       fluxo linear da Ilda. Fica no código junto com os renders delas, mas o
       fluxo atual segue reto da tela 12 (Cor final) para o dossiê. */
    function rotaDaCor() {
      var familia = familiaDoEstado(estado);
      var teto = estado.teto;
      if (teto === null) teto = MOTOR.tetoDeClareamento(estado.baseNatural, familia ? familia.tetoClareamento : 4);
      if (familia && teto !== null) return MOTOR.rotaDaTela11(familia, teto);
      return 12;
    }

    function proximaTela(n) {
      return n + 1;
    }

    function avancar() {
      var meta = metaDaTela(telaAtual);
      var cheque = MOTOR.validaEtapa(estado, meta ? meta.tela : telaAtual);
      if (!cheque.ok) {
        elMotivo.textContent = cheque.motivo;
        elTela.focus();
        return;
      }
      if (telaAtual === TOTAL_TELAS) {
        reiniciar();
        return;
      }
      var destino = proximaTela(telaAtual);
      if (destino === null) {
        elMotivo.textContent = 'Esta tela não tem avanço no fluxo atual.';
        return;
      }
      telaAtual = destino;
      trilha.push(destino);
      salvar();
      rolarParaTopo = true;
      render();
      elTela.focus();
    }

    function voltar() {
      if (trilha.length > 1) {
        trilha.pop();
        telaAtual = trilha[trilha.length - 1];
      } else if (telaAtual > 1) {
        telaAtual -= 1;
        trilha = [telaAtual];
      } else {
        return;
      }
      salvar();
      rolarParaTopo = true;
      render();
      elTela.focus();
    }

    function irPara(n) {
      var alvo = Number(n);
      if (!Number.isInteger(alvo) || alvo < 1 || alvo > TOTAL_TELAS) {
        elMotivo.textContent = 'Tela inválida: ' + n + '.';
        return false;
      }
      var posicao = trilha.lastIndexOf(alvo);
      if (posicao !== -1) trilha = trilha.slice(0, posicao + 1);
      else trilha.push(alvo);
      telaAtual = alvo;
      salvar();
      rolarParaTopo = true;
      render();
      elTela.focus();
      return true;
    }

    /* ---------- render ---------- */

    function montarProgresso() {
      elProgresso.innerHTML = '';
      BLOCOS.forEach(function (bloco) {
        var segmento = document.createElement('span');
        segmento.className = 'progresso-seg';
        segmento.setAttribute('data-bloco', bloco.id);
        segmento.title = 'Bloco ' + bloco.letra + ' · ' + bloco.nome;
        elProgresso.appendChild(segmento);
      });
      elProgresso.setAttribute('role', 'progressbar');
      elProgresso.setAttribute('aria-valuemin', '1');
      elProgresso.setAttribute('aria-valuemax', String(BLOCOS.length));
    }

    function atualizarProgresso(blocoAtualId) {
      var indiceAtual = 0;
      BLOCOS.forEach(function (bloco, i) {
        if (bloco.id === blocoAtualId) indiceAtual = i;
      });
      Array.prototype.forEach.call(elProgresso.children, function (segmento, i) {
        segmento.classList.toggle('feito', i < indiceAtual);
        segmento.classList.toggle('atual', i === indiceAtual);
      });
      elProgresso.setAttribute('aria-valuenow', String(indiceAtual + 1));
      elProgresso.setAttribute('aria-label', 'Bloco ' + (indiceAtual + 1) + ' de ' + BLOCOS.length + ': ' + BLOCOS[indiceAtual].nome);
    }

    function criarContexto() {
      return {
        estado: estado,
        salvar: salvar,
        irPara: irPara,
        recarregar: render,
        atualizar: atualizarRodape,
        dados: DADOS,
        motor: MOTOR
      };
    }

    function render() {
      var meta = metaDaTela(telaAtual) || { titulo: 'Tela ' + telaAtual, bloco: 'abertura' };
      var bloco = blocoPorId(meta.bloco);

      elBloco.textContent = 'Bloco ' + bloco.letra + ' · ' + bloco.nome;
      elTelaNome.textContent = meta.titulo;
      elTelaNum.textContent = telaAtual === TELA_DOSSIE
        ? 'Etapa ' + TELA_DOSSIE + ' · dossiê final'
        : 'Tela ' + telaAtual + ' de ' + TELAS.length;
      atualizarProgresso(meta.bloco);

      elTela.innerHTML = '';
      var definicao = telasRegistradas[meta.tela];

      if (!definicao || typeof definicao.render !== 'function') {
        elTela.innerHTML = cartaoEmConstrucao(telaAtual, meta, bloco);
      } else {
        try {
          definicao.render(elTela, criarContexto());
        } catch (err) {
          console.error('[visage] Falha ao desenhar a tela ' + telaAtual + '.', err);
          elTela.innerHTML = cartaoErro(telaAtual, err);
          var tentar = elTela.querySelector('[data-acao="tentar"]');
          if (tentar) tentar.addEventListener('click', render);
          var voltarErro = elTela.querySelector('[data-acao="voltar"]');
          if (voltarErro) voltarErro.addEventListener('click', voltar);
        }
      }

      atualizarRodape();
      renderAviso();
      if (rolarParaTopo) {
        elTela.scrollTop = 0;
        rolarParaTopo = false;
      }
      document.title = 'Tela ' + telaAtual + ' · ' + meta.titulo + ' — Art Visage Harmonie';    }

    function cartaoEmConstrucao(n, meta, bloco) {
      return '<section class="cartao cartao-construcao" aria-labelledby="titulo-construcao">' +
        '<p class="sobretitulo">Bloco ' + bloco.letra + ' · ' + bloco.nome + '</p>' +
        '<h2 id="titulo-construcao">Tela ' + n + ' — em construção</h2>' +
        '<p class="texto">Esta etapa não está disponível nesta versão do protótipo.</p>' +
        '<p class="texto-suave">O botão Continuar segue disponível: ele apenas percorre as telas em construção. Voltar retorna ao fluxo já entregue.</p>' +
        '</section>';
    }

    function cartaoErro(n, err) {
      var mensagem = err && err.message ? err.message : String(err);
      return '<section class="cartao cartao-erro" role="alert" aria-labelledby="titulo-erro">' +
        '<p class="sobretitulo">Falha de renderização</p>' +
        '<h2 id="titulo-erro">Não foi possível desenhar a tela ' + n + '</h2>' +
        '<p class="texto">' + escapar(mensagem) + '</p>' +
        '<p class="texto-suave">O erro foi registrado no console. Você pode tentar novamente ou voltar para a tela anterior.</p>' +
        '<div class="acoes-inline">' +
        '<button type="button" class="btn btn-secundario" data-acao="tentar">Tentar novamente</button>' +
        '<button type="button" class="btn btn-secundario" data-acao="voltar">Voltar</button>' +
        '</div></section>';
    }

    function atualizarRodape() {
      var meta = metaDaTela(telaAtual);
      var cheque = MOTOR.validaEtapa(estado, meta ? meta.tela : telaAtual);
      var bloqueioTratamento = cheque.bloqueio === 'tratamento';

      elAvancar.disabled = !cheque.ok;
      elAvancar.textContent = telaAtual === TOTAL_TELAS
        ? 'Reiniciar demonstração'
        : (bloqueioTratamento ? 'Prescrição bloqueada' : 'Continuar');
      elAvancar.classList.toggle('btn-bloqueado', bloqueioTratamento);

      var primeira = telaAtual === 1 && trilha.length <= 1;
      elVoltar.hidden = primeira;
      elVoltar.disabled = primeira;

      elMotivo.textContent = cheque.ok ? '' : cheque.motivo;
      elMotivo.classList.toggle('motivo-bloqueio', bloqueioTratamento);
    }

    function renderAviso() {
      if (aviso) {
        elAviso.hidden = false;
        elAviso.textContent = aviso;
      } else {
        elAviso.hidden = true;
        elAviso.textContent = '';
      }
    }
  }

  function escapar(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})(typeof window !== 'undefined' ? window : this);
