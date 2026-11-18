/* Telas 1 a 9 — blocos Abertura, Leitura e Rosto.
   Registradas em window.VISAGE.registrarTela(n, {titulo, bloco, render(el, ctx)}). */
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

  var CLIENTES_DEMO = [
    { nome: 'Marina Albuquerque', contato: '(11) 98888-0001', ultimo: '12 mar 2026', base: 6 },
    { nome: 'Juliana Costa', contato: '(11) 97777-0002', ultimo: '03 fev 2026', base: 4 },
    { nome: 'Renata Sales', contato: '(11) 96666-0003', ultimo: '18 jan 2026', base: 8 }
  ];

  var PROFUNDIDADES = [
    { id: 'clara', nome: 'Clara' },
    { id: 'media', nome: 'Média' },
    { id: 'profunda', nome: 'Profunda' }
  ];

  var ROTAS = [
    {
      id: 'harmonia',
      nome: 'Harmonia',
      descricao: 'Ser lida como um todo — a cor nasce da pele',
      consequencia: 'A cor nasce da pele: a família é prescrita a partir da profundidade e o teto do fio limita o clareamento.',
      rotulo: 'Família prescrita'
    },
    {
      id: 'iris',
      nome: 'Íris',
      descricao: 'Reforçar o que já é — a cor nasce da íris',
      consequencia: 'A cor nasce da íris: a paleta é prescrita como referência do que já existe nela.',
      rotulo: 'Paleta prescrita'
    },
    {
      id: 'estilo',
      nome: 'Estilo',
      descricao: 'Uma cor que não vem das características naturais',
      consequencia: 'A cor não vem das características naturais: ela é proposta com o desejo como desvio consciente.',
      rotulo: 'Cor proposta'
    }
  ];

  var MINIATURAS_ROSTO = {
    oval: '<ellipse cx="50" cy="60" rx="32" ry="44"/>',
    redondo: '<circle cx="50" cy="60" r="38"/>',
    quadrado: '<rect x="16" y="18" width="68" height="84" rx="9"/>',
    retangular: '<rect x="24" y="12" width="52" height="96" rx="11"/>',
    triangular: '<polygon points="30,20 70,20 88,102 12,102"/>',
    'triangulo-invertido': '<polygon points="12,20 88,20 64,102 36,102"/>',
    losangular: '<polygon points="50,10 82,46 50,110 18,46"/>',
    hexagonal: '<polygon points="30,18 70,18 88,60 70,102 30,102 12,60"/>'
  };

  var modoNovoCliente = false;

  /* ---------- helpers de UI ---------- */

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

  function opcao(valor, titulo, sub, selecionado, classeExtra) {
    return '<button type="button" class="opcao' + (selecionado ? ' selecionada' : '') + (classeExtra ? ' ' + classeExtra : '') + '"' +
      ' data-valor="' + esc(valor) + '" aria-pressed="' + (selecionado ? 'true' : 'false') + '">' +
      '<span class="opcao-marca" aria-hidden="true"></span>' +
      '<span class="opcao-texto"><span class="opcao-titulo">' + esc(titulo) + '</span>' +
      (sub ? '<small class="opcao-sub">' + esc(sub) + '</small>' : '') +
      '</span></button>';
  }

  /* Guarda o texto digitado no estado; campo vazio limpa a chave. */
  /* Salva o texto enquanto a profissional digita; o avanco e o botao unico
     do rodape (sem duplicar "Continuar" na tela). */
  function ligarTexto(raiz, id, estado, chave) {
    if (!estado) return;
    var campo = raiz.querySelector('#' + id);
    if (!campo) return;
    campo.addEventListener('input', function () { salvarTexto(raiz, id, estado, chave); });
    campo.addEventListener('change', function () { salvarTexto(raiz, id, estado, chave); });
  }

  function salvarTexto(raiz, id, estado, chave) {
    if (!estado) return;
    var campo = raiz.querySelector('#' + id);
    if (!campo) return;
    var valor = String(campo.value == null ? '' : campo.value).trim();
    if (valor) estado[chave] = valor;
    else delete estado[chave];
  }

  function ligarOpcoes(raiz, seletor, aoEscolher) {
    Array.prototype.forEach.call(raiz.querySelectorAll(seletor), function (botao) {
      botao.addEventListener('click', function () {
        if (botao.getAttribute('data-ocupado') === '1') return;
        botao.setAttribute('data-ocupado', '1');
        Array.prototype.forEach.call(raiz.querySelectorAll(seletor), function (outro) {
          outro.classList.remove('selecionada', 'selecionando');
          outro.setAttribute('aria-pressed', 'false');
        });
        botao.classList.add('selecionada');
        botao.setAttribute('aria-pressed', 'true');
        /* Feedback de seleção antes de virar a tela: sem isso o clique
           parece não ter resposta (reclamação das telas 4 e 5). */
        botao.classList.add('selecionando');
        setTimeout(function () {
          aoEscolher(botao.getAttribute('data-valor'), botao);
        }, 240);
      });
    });
  }

  function avancarCom(ctx) {
    ctx.salvar();
    ctx.recarregar();
  }

  /* ---------- TELA 1 ---------- */

  function render1(el, ctx) {
    var e = ctx.estado;
    var nomeAtual = e.cliente && typeof e.cliente.nome === 'string' ? e.cliente.nome.trim() : '';
    var contatoAtual = e.cliente && typeof e.cliente.contato === 'string' ? e.cliente.contato : '';
    var clienteDemo = CLIENTES_DEMO.filter(function (c) { return c.nome === nomeAtual; })[0] || null;
    var exibindoForm = modoNovoCliente || (!!nomeAtual && !clienteDemo);
    var selecionado = clienteDemo && !exibindoForm ? clienteDemo.nome : '';

    var lista = CLIENTES_DEMO.map(function (c) {
      var ativo = c.nome === selecionado;
      return '<button type="button" class="opcao cliente-opcao' + (ativo ? ' selecionada' : '') + '"' +
        ' data-cliente="' + esc(c.nome) + '" data-busca="' + esc((c.nome + ' ' + c.contato).toLowerCase()) + '"' +
        ' aria-pressed="' + (ativo ? 'true' : 'false') + '">' +
        '<span class="opcao-marca" aria-hidden="true"></span>' +
        '<span class="opcao-texto"><span class="opcao-titulo">' + esc(c.nome) + '</span>' +
        '<small class="opcao-sub">Último atendimento: ' + esc(c.ultimo) + ' · base ' + esc(DADOS.formatarAltura(c.base)) + '</small>' +
        '</span></button>';
    }).join('');

    el.innerHTML =
      '<h2>Quem está na cadeira?</h2>' +
      '<p class="lead">Busque a cliente cadastrada ou abra o cadastro. Tudo o que for registrado fica no prontuário dela — e só você vê.</p>' +
      '<div class="campo">' +
        '<label class="rotulo" for="buscaCliente">Buscar cliente cadastrada</label>' +
        '<input type="search" id="buscaCliente" placeholder="Nome ou telefone" autocomplete="off">' +
      '</div>' +
      '<p class="hint" id="dicaBusca">Digite o nome ou o telefone para ver os cadastros. A lista de atendimentos recentes saiu desta tela: quem não está aqui entra pelo cadastro.</p>' +
      '<div class="lista-clientes" id="listaClientes" hidden>' + lista + '</div>' +
      '<p class="vazio" id="listaVazia" hidden>Nenhuma cliente encontrada com esse termo.</p>' +
      '<button type="button" class="btn btn-secundario btn-largo" data-acao="nova-cliente">Cadastrar nova cliente</button>' +
      '<button type="button" class="btn btn-secundario btn-largo btn-demo" data-acao="cliente-demo">Usar cliente de demonstração</button>' +
      '<div class="painel-novo" id="painelNovo"' + (exibindoForm ? '' : ' hidden') + '>' +
        '<p class="rotulo">Cadastro da nova cliente</p>' +
        '<div class="campo">' +
          '<label class="rotulo" for="clienteNome">Nome</label>' +
          '<input type="text" id="clienteNome" autocomplete="name" value="' + esc(nomeAtual) + '" placeholder="Nome completo">' +
        '</div>' +
        '<div class="campo">' +
          '<label class="rotulo" for="clienteContato">Contato</label>' +
          '<input type="text" id="clienteContato" autocomplete="tel" value="' + esc(contatoAtual) + '" placeholder="Telefone ou e-mail">' +
        '</div>' +
        '<p class="hint">Nome e contato são obrigatórios para abrir o prontuário.</p>' +
        '<button type="button" class="btn btn-secundario btn-largo" data-acao="voltar-lista">Voltar à lista</button>' +
      '</div>' +
      '<div class="nota"><b>O que esta tela não faz:</b> não interpreta o histórico, não sugere rota e não classifica a cliente.</div>';

    Array.prototype.forEach.call(el.querySelectorAll('.cliente-opcao'), function (botao) {
      botao.addEventListener('click', function () {
        var nome = botao.getAttribute('data-cliente');
        var cliente = CLIENTES_DEMO.filter(function (c) { return c.nome === nome; })[0];
        if (!cliente) return;
        modoNovoCliente = false;
        e.cliente = { nome: cliente.nome, contato: cliente.contato };
        avancarCom(ctx);
      });
    });

    var busca = el.querySelector('#buscaCliente');
    var vazia = el.querySelector('#listaVazia');
    var caixaLista = el.querySelector('#listaClientes');
    var dica = el.querySelector('#dicaBusca');
    if (busca) {
      busca.addEventListener('input', function () {
        var termo = busca.value.trim().toLowerCase();
        var visiveis = 0;
        Array.prototype.forEach.call(el.querySelectorAll('.cliente-opcao'), function (botao) {
          var combina = !!termo && (botao.getAttribute('data-busca') || '').indexOf(termo) !== -1;
          botao.hidden = !combina;
          if (combina) visiveis += 1;
        });
        /* Sem termo a tela não lista ninguém: acabaram os "recentes". */
        if (caixaLista) caixaLista.hidden = !termo;
        if (dica) dica.hidden = !!termo;
        if (vazia) vazia.hidden = !termo || visiveis !== 0;
      });
    }

    var demo = el.querySelector('[data-acao="cliente-demo"]');
    if (demo) {
      demo.addEventListener('click', function () {
        var cliente = CLIENTES_DEMO[0];
        if (!cliente) return;
        modoNovoCliente = false;
        e.cliente = { nome: cliente.nome, contato: cliente.contato };
        ctx.salvar();
        /* Feedback: revela o cadastro escolhido em vez de deixar a tela sem
           sinal de que o cliente entrou. O Continuar do rodapé avança. */
        if (caixaLista) caixaLista.hidden = false;
        if (dica) dica.hidden = true;
        Array.prototype.forEach.call(el.querySelectorAll('.cliente-opcao'), function (botao) {
          var ativo = botao.getAttribute('data-cliente') === cliente.nome;
          botao.hidden = false;
          botao.classList.toggle('selecionada', ativo);
          botao.setAttribute('aria-pressed', ativo ? 'true' : 'false');
        });
        ctx.atualizar();
      });
    }

    var nova = el.querySelector('[data-acao="nova-cliente"]');
    if (nova) {
      nova.addEventListener('click', function () {
        modoNovoCliente = true;
        e.cliente = null;
        avancarCom(ctx);
        var campoNome = document.getElementById('clienteNome');
        if (campoNome) campoNome.focus();
      });
    }

    var voltarLista = el.querySelector('[data-acao="voltar-lista"]');
    if (voltarLista) {
      voltarLista.addEventListener('click', function () {
        modoNovoCliente = false;
        e.cliente = null;
        avancarCom(ctx);
      });
    }

    var campoNome = el.querySelector('#clienteNome');
    var campoContato = el.querySelector('#clienteContato');
    function atualizarCliente() {
      e.cliente = {
        nome: campoNome ? campoNome.value : '',
        contato: campoContato ? campoContato.value : ''
      };
      ctx.salvar();
      ctx.atualizar();
    }
    if (campoNome) campoNome.addEventListener('input', atualizarCliente);
    if (campoContato) campoContato.addEventListener('input', atualizarCliente);
  }

  /* ---------- TELA 2 ---------- */

  function render2(el, ctx) {
    var e = ctx.estado;
    var registrado = typeof e.desejo === 'string' && e.desejo.trim().length > 0;

    el.innerHTML =
      '<h2>Qual é o desejo dela?</h2>' +
      '<p class="lead">Escreva com as palavras dela. Gíria, hesitação e “não sei” também são registro.</p>' +
      '<div class="campo">' +
        '<label class="rotulo" for="desejo">Desejo, nas palavras da cliente</label>' +
        '<textarea id="desejo" placeholder="Ex.: “queria um loiro mas sem ficar amarelo, meu cabelo já está castigado”">' + esc(e.desejo || '') + '</textarea>' +
      '</div>' +
      '<p class="estado-desejo" id="estadoDesejo" role="status">' +
        (registrado ? 'Registrado no prontuário.' : 'Desejo não registrado — o dossiê vai refletir isso.') +
      '</p>' +
      '<button type="button" class="btn btn-secundario btn-largo" data-acao="nao-registrado">Não registrado</button>' +
      '<div class="nota"><b>Componente 1 do dossiê.</b> Este texto entra antes de qualquer cor. A tela não interpreta o desejo, não sugere rota e não classifica o pedido.</div>';

    var campo = el.querySelector('#desejo');
    var status = el.querySelector('#estadoDesejo');

    function atualizarStatus() {
      if (!status) return;
      var temTexto = campo && campo.value.trim().length > 0;
      status.textContent = temTexto ? 'Registrado no prontuário.' : 'Desejo não registrado — o dossiê vai refletir isso.';
      status.classList.toggle('estado-desejo-ativo', temTexto);
    }

    if (campo) {
      campo.addEventListener('input', function () {
        e.desejo = campo.value.trim() ? campo.value : null;
        ctx.salvar();
        atualizarStatus();
        ctx.atualizar();
      });
    }

    var naoRegistrado = el.querySelector('[data-acao="nao-registrado"]');
    if (naoRegistrado) {
      naoRegistrado.addEventListener('click', function () {
        e.desejo = null;
        if (campo) campo.value = '';
        ctx.salvar();
        atualizarStatus();
        ctx.atualizar();
        if (campo) campo.focus();
      });
    }
  }

  /* ---------- TELA 3 ---------- */

  function render3(el, ctx) {
    var e = ctx.estado;
    var cards = ROTAS.map(function (rota) {
      var ativa = e.rota === rota.id;
      return '<button type="button" class="opcao opcao-rota' + (ativa ? ' selecionada' : '') + '"' +
        ' data-rota="' + rota.id + '" aria-pressed="' + (ativa ? 'true' : 'false') + '">' +
        '<span class="opcao-marca" aria-hidden="true"></span>' +
        '<span class="opcao-texto">' +
          '<span class="linha-rotulo"><span class="opcao-titulo">' + esc(rota.nome) + '</span>' +
          '<span class="selo selo-' + rota.id + '">' + esc(rota.rotulo) + '</span></span>' +
          '<small class="opcao-sub">' + esc(rota.descricao) + '</small>' +
          '<span class="consequencia">' + esc(rota.consequencia) + '</span>' +
        '</span></button>';
    }).join('');

    el.innerHTML =
      '<h2>Rota escolhida</h2>' +
      '<p class="lead">A rota nasce da conversa. O app não sugere, não pré-seleciona e não infere pelo histórico.</p>' +
      '<div class="opcoes">' + cards + '</div>';

    Array.prototype.forEach.call(el.querySelectorAll('[data-rota]'), function (botao) {
      botao.addEventListener('click', function () {
        if (botao.getAttribute('data-ocupado') === '1') return;
        botao.setAttribute('data-ocupado', '1');
        Array.prototype.forEach.call(el.querySelectorAll('[data-rota]'), function (outro) {
          outro.classList.remove('selecionada', 'selecionando');
        });
        botao.classList.add('selecionada', 'selecionando');
        e.rota = botao.getAttribute('data-rota');
        e.rotaRotulo = e.rota === 'estilo' ? 'proposta' : 'prescrita';
        setTimeout(function () { avancarCom(ctx); }, 240);
      });
    });
  }

  /* ---------- TELA 4 ---------- */

  function render4(el, ctx) {
    var e = ctx.estado;
    var opcoes = PROFUNDIDADES.map(function (p) {
      return opcao(p.id, p.nome, '', e.profundidade === p.id);
    }).join('');

    el.innerHTML =
      '<h2>Profundidade da pele</h2>' +
      '<p class="lead lead-destaque">Profundidade de pele é uma medida: o quão clara ou escura é a pele.</p>' +
      '<p class="texto-suave">A temperatura não é lida aqui: ela só vale depois do Kit de Tecidos.</p>' +
      '<div class="grade grade-3">' + opcoes + '</div>';

    ligarOpcoes(el, '[data-valor]', function (valor) {
      if (e.profundidade !== valor) {
        e.contraste = null;
        e.contrasteAjuste = null;
      }
      e.profundidade = valor;
      avancarCom(ctx);
    });
  }

  /* ---------- TELA 5 ---------- */

  function render5(el, ctx) {
    var e = ctx.estado;
    var opcoes = DADOS.ALTURAS.map(function (altura) {
      return opcao(String(altura), DADOS.formatarAltura(altura), '', e.baseNatural === altura);
    }).join('');

    el.innerHTML =
      '<h2>Base natural</h2>' +
      '<p class="lead">Ancore a base com a amostra na mão dela. O app não estima.</p>' +
      '<div class="grade grade-3">' + opcoes + '</div>' +
      '<p class="hint">A altura 02 não existe no mercado — a lista salta de 01 para 03.</p>' +
      '<div class="campo">' +
        '<label class="rotulo" for="corCosmetica">Escala de cor cosmética (descrição livre)</label>' +
        '<textarea id="corCosmetica" class="entrada" rows="3" placeholder="Ex.: 6.0 com reflexo acobreado, marca X, descoloração residual nos fios anteriores">' + esc(e.corCosmetica || '') + '</textarea>' +
        '<p class="hint">Descreva o que está na etiqueta e o que você está vendo no fio. É registro, não cálculo.</p>' +
      '</div>' +
      '<div class="nota"><b>Por que agora:</b> a base natural entra antes do contraste, porque o contraste é calculado a partir dela.</div>';

    ligarOpcoes(el, '[data-valor]', function (valor) {
      var altura = Number(valor);
      if (e.baseNatural !== altura) {
        e.contraste = null;
        e.contrasteAjuste = null;
      }
      e.baseNatural = altura;
      ctx.salvar();
      ctx.recarregar();
    });

    ligarTexto(el, 'corCosmetica', e, 'corCosmetica');
  }

  /* ---------- TELA 6 — Cabelos brancos ---------- */

  var FAIXAS_BRANCOS = [
    { id: 'nenhum', titulo: 'Nenhum', sub: '0%' },
    { id: 'poucos', titulo: 'Poucos', sub: 'até 25%' },
    { id: 'metade', titulo: 'Metade', sub: '25% a 50%' },
    { id: 'maioria', titulo: 'Maioria', sub: '50% a 75%' },
    { id: 'quase-tudo', titulo: 'Quase tudo', sub: 'acima de 75%' }
  ];

  function render6(el, ctx) {
    var e = ctx.estado;
    var opcoes = FAIXAS_BRANCOS.map(function (f) {
      return opcao(f.id, f.titulo, f.sub, e.brancos === f.id);
    }).join('');

    el.innerHTML =
      '<h2>Percentual de cabelos brancos</h2>' +
      '<p class="lead">Quanto de branco existe na cabeça hoje. Isso muda a leitura da base e o que a química pode fazer.</p>' +
      '<div class="opcoes">' + opcoes + '</div>' +
      '<div class="campo">' +
        '<label class="rotulo" for="brancosObs">Observação (opcional)</label>' +
        '<textarea id="brancosObs" class="entrada" rows="2" placeholder="Ex.: branco concentrado na frente e nas têmporas">' + esc(e.brancosObs || '') + '</textarea>' +
      '</div>' +
      '<div class="nota"><b>Registro, não diagnóstico:</b> a faixa é o que a profissional vê. O app não estima por foto.</div>';

    ligarOpcoes(el, '[data-valor]', function (valor) {
      e.brancos = valor;
      ctx.salvar();
      ctx.recarregar();
    });

    ligarTexto(el, 'brancosObs', e, 'brancosObs');
  }

  /* ---------- TELA 6 ---------- */

  function render6Contraste(el, ctx) {
    var e = ctx.estado;
    var calculo;

    try {
      calculo = MOTOR.contraste(e.profundidade, e.baseNatural);
    } catch (err) {
      calculo = null;
    }

    if (!calculo) {
      el.innerHTML =
        '<h2>Contraste</h2>' +
        '<p class="lead">O contraste é a distância entre a profundidade da pele e a altura da base natural do cabelo.</p>' +
        '<section class="cartao cartao-alerta" role="alert">' +
          '<h3>Faltam dados para calcular</h3>' +
          '<p class="texto">O contraste não pode ser perguntado: ele precisa da profundidade da pele e da base natural do cabelo.</p>' +
          '<div class="acoes-inline">' +
            '<button type="button" class="btn btn-secundario" data-acao="ir-4">Ir para a profundidade da pele</button>' +
            '<button type="button" class="btn btn-secundario" data-acao="ir-5">Ir para a base natural</button>' +
          '</div>' +
        '</section>';
      var ir4 = el.querySelector('[data-acao="ir-4"]');
      var ir5 = el.querySelector('[data-acao="ir-5"]');
      if (ir4) ir4.addEventListener('click', function () { ctx.irPara(4); });
      if (ir5) ir5.addEventListener('click', function () { ctx.irPara(5); });
      return;
    }

    var ajustado = !!e.contrasteAjuste;
    var confirmado = e.contraste === calculo.nivel && !ajustado;
    var nivelRegistrado = e.contraste || calculo.nivel;
    var rotuloRegistrado = nivelRegistrado.toUpperCase();

    var estadoSelo = confirmado
      ? '<span class="selo selo-ok">Calculado e confirmado</span>'
      : (ajustado ? '<span class="selo selo-ajuste">Ajustado manualmente</span>' : '<span class="selo">Aguardando confirmação</span>');

    var detalheAjuste = '';
    if (ajustado) {
      detalheAjuste =
        '<div class="ajuste-registrado">' +
          '<p><b>Registro do ajuste:</b> ' + esc(formatarData(e.contrasteAjuste.data)) + '</p>' +
          '<p><b>Justificativa:</b> ' + esc(e.contrasteAjuste.justificativa) + '</p>' +
        '</div>';
    }

    var niveis = [
      { id: 'baixo', nome: 'Baixo' },
      { id: 'medio', nome: 'Médio' },
      { id: 'alto', nome: 'Alto' }
    ].map(function (n) {
      return '<label class="opcao-radio">' +
        '<input type="radio" name="nivelAjuste" value="' + n.id + '"' + (nivelRegistrado === n.id ? ' checked' : '') + '>' +
        '<span>' + n.nome + '</span></label>';
    }).join('');

    el.innerHTML =
      '<h2>Contraste</h2>' +
      '<p class="lead">O app cruza as duas leituras que você já registrou. O contraste é a distância entre elas.</p>' +
      '<section class="cartao cartao-calculo" aria-labelledby="calculoTitulo">' +
        '<p class="sobretitulo" id="calculoTitulo">Cálculo do contraste</p>' +
        '<p class="calculo-texto">' + esc(calculo.texto) + '</p>' +
        '<div class="calculo-resultado">' +
          '<span class="nivel-nome">Contraste ' + esc(rotuloRegistrado) + '</span>' +
          estadoSelo +
        '</div>' +
        detalheAjuste +
        '<div class="acoes-inline">' +
          '<button type="button" class="btn btn-primario" data-acao="confirmar">Confirmar cálculo</button>' +
          '<button type="button" class="btn btn-secundario" data-acao="abrir-ajuste">' + (ajustado ? 'Revisar ajuste manual' : 'Ajustar manualmente') + '</button>' +
        '</div>' +
      '</section>' +
      '<section class="painel-ajuste" id="painelAjuste"' + (ajustado ? '' : ' hidden') + ' aria-labelledby="tituloAjuste">' +
        '<h3 id="tituloAjuste">Ajuste manual do contraste</h3>' +
        '<p class="texto-suave">O ajuste exige um nível e uma justificativa. O registro fica no prontuário com data.</p>' +
        '<fieldset class="grupo-radio"><legend class="rotulo">Nível registrado</legend>' + niveis + '</fieldset>' +
        '<div class="campo">' +
          '<label class="rotulo" for="justificativa">Justificativa (obrigatória)</label>' +
          '<textarea id="justificativa" placeholder="Por que o cálculo não representa o que você lê nesta cliente?">' + esc(ajustado ? e.contrasteAjuste.justificativa : '') + '</textarea>' +
        '</div>' +
        '<p class="erro" id="erroAjuste" role="alert" hidden></p>' +
        '<div class="acoes-inline">' +
          '<button type="button" class="btn btn-primario" data-acao="salvar-ajuste">Registrar ajuste</button>' +
          '<button type="button" class="btn btn-secundario" data-acao="cancelar-ajuste">Cancelar</button>' +
        '</div>' +
      '</section>' +
      '<div class="nota"><b>o app calcula; a profissional valida.</b> O cálculo usa a profundidade da pele e a altura da base — nunca uma pergunta solta de contraste.</div>';

    var painel = el.querySelector('#painelAjuste');
    var erro = el.querySelector('#erroAjuste');

    var abrir = el.querySelector('[data-acao="abrir-ajuste"]');
    if (abrir) {
      abrir.addEventListener('click', function () {
        if (!painel) return;
        painel.hidden = false;
        var primeiro = painel.querySelector('input[type="radio"]');
        if (primeiro) primeiro.focus();
      });
    }

    var cancelar = el.querySelector('[data-acao="cancelar-ajuste"]');
    if (cancelar) {
      cancelar.addEventListener('click', function () {
        if (!painel) return;
        painel.hidden = true;
        if (erro) erro.hidden = true;
        if (abrir) abrir.focus();
      });
    }

    var confirmar = el.querySelector('[data-acao="confirmar"]');
    if (confirmar) {
      confirmar.addEventListener('click', function () {
        e.contraste = calculo.nivel;
        e.contrasteAjuste = null;
        avancarCom(ctx);
      });
    }

    var salvarAjuste = el.querySelector('[data-acao="salvar-ajuste"]');
    if (salvarAjuste) {
      salvarAjuste.addEventListener('click', function () {
        var marcado = painel ? painel.querySelector('input[name="nivelAjuste"]:checked') : null;
        var campoJustificativa = el.querySelector('#justificativa');
        var justificativa = campoJustificativa ? campoJustificativa.value.trim() : '';

        if (!marcado) {
          if (erro) {
            erro.textContent = 'Escolha o nível do contraste: Baixo, Médio ou Alto.';
            erro.hidden = false;
          }
          return;
        }
        if (!justificativa) {
          if (erro) {
            erro.textContent = 'A justificativa é obrigatória para registrar um ajuste manual.';
            erro.hidden = false;
          }
          if (campoJustificativa) campoJustificativa.focus();
          return;
        }

        e.contraste = marcado.value;
        e.contrasteAjuste = {
          nivel: marcado.value,
          justificativa: justificativa,
          data: new Date().toISOString()
        };
        avancarCom(ctx);
      });
    }
  }

  /* ---------- TELA 7 ---------- */

  function render7(el, ctx) {
    var e = ctx.estado;
    var opcoes = [
      { id: 'comporta', titulo: 'O fio comporta cor', sub: '' },
      { id: 'comprometido', titulo: 'O fio está comprometido', sub: 'Cuidados antes da cor' },
      { id: 'sem', titulo: 'Sem condição para receber cor', sub: 'A prescrição fica bloqueada' }
    ].map(function (o) {
      return opcao(o.id, o.titulo, o.sub, e.saudeFio === o.id, o.id === 'sem' ? 'opcao-perigo' : '');
    }).join('');

    var orientacao = '';
    if (e.saudeFio === 'sem') {
      orientacao =
        '<section class="cartao cartao-bloqueio" role="alert" aria-labelledby="tituloTratamento">' +
          '<p class="sobretitulo">RN-22 · prescrição bloqueada</p>' +
          '<h3 id="tituloTratamento">Orientação de tratamento</h3>' +
          '<p class="texto">O fio não recebe cor agora. Antes de qualquer prescrição de cor, a prioridade é o tratamento do fio — reconstrução e hidratação conduzidas pela profissional, com reavaliação da condição em um próximo atendimento.</p>' +
          '<p class="texto-suave">O bloqueio vale para as três rotas. Para seguir no fluxo, registre uma condição que permita a prescrição.</p>' +
        '</section>';
    }

    el.innerHTML =
      '<h2>Como ficou o teste</h2>' +
      '<p class="lead">Avaliação obrigatória nas três rotas, antes de qualquer prescrição.</p>' +
      '<div class="opcoes">' + opcoes + '</div>' +
      orientacao +
      '<div class="nota"><b>RN-22:</b> fio sem condição impede a prescrição, independentemente da rota, e desvia o fluxo para a orientação de tratamento.</div>';

    ligarOpcoes(el, '[data-valor]', function (valor) {
      e.saudeFio = valor;
      avancarCom(ctx);
    });
  }

  /* ---------- TELA 8 ---------- */

  /* Ilustracoes de corte (traco, nunca foto): mudam com formato e estatura. */
  function blocoDeCortes(formato, e) {
    var lib = VISAGE.ilustracoesCorte;
    if (!lib || typeof lib.cortesDoFormato !== 'function') return '';
    var estatura = e.estatura || 'media';
    var cortes = lib.cortesDoFormato(formato.id, estatura);
    if (!cortes.length) {
      return '<div class="nota"><b>Sem ilustração para este formato.</b> A tabela do método não separa cortes aqui.</div>';
    }
    var cartoes = cortes.map(function (corte) {
      return '<figure class="cartao-corte">' + corte.svg +
        '<figcaption>' + esc(corte.nome) + '</figcaption></figure>';
    }).join('');
    return '<section class="cartao cartao-ilustracoes" aria-labelledby="tituloCortes">' +
      '<p class="sobretitulo" id="tituloCortes">Opções de corte · estatura ' + esc(estatura) + '</p>' +
      '<div class="grade-cortes">' + cartoes + '</div>' +
      '<p class="hint">Ilustrações de traço, não fotos. Servem para conversar com a cliente sobre direção.</p>' +
      '</section>';
  }

  function render8(el, ctx) {
    var e = ctx.estado;
    var cards = DADOS.FORMATOS_ROSTO.map(function (formato) {
      var ativo = e.formatoRosto === formato.id;
      var desenho = MINIATURAS_ROSTO[formato.id] || '';
      return '<button type="button" class="opcao opcao-rosto' + (ativo ? ' selecionada' : '') + '"' +
        ' data-formato="' + formato.id + '" aria-pressed="' + (ativo ? 'true' : 'false') + '">' +
        '<svg class="mini-rosto" viewBox="0 0 100 120" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round">' + desenho + '</svg>' +
        '<span class="opcao-titulo">' + esc(formato.nome) + '</span>' +
        '</button>';
    }).join('');

    var estaturas = (VISAGE.ilustracoesCorte ? VISAGE.ilustracoesCorte.ESTATURAS : []);
    var botoesEstatura = estaturas.map(function (est) {
      var ativo = e.estatura === est.id;
      return '<button type="button" class="opcao opcao-compacta' + (ativo ? ' selecionada' : '') + '"' +
        ' data-estatura="' + est.id + '" aria-pressed="' + (ativo ? 'true' : 'false') + '">' +
        '<span class="opcao-titulo">' + esc(est.titulo) + '</span>' +
        '<span class="opcao-sub">' + esc(est.sub) + '</span>' +
        '</button>';
    }).join('');

    el.innerHTML =
      '<h2>Formato do rosto</h2>' +
      '<p class="lead">Compare o contorno com as oito formas geométricas. A miniatura ajuda a separar as parecidas.</p>' +
      '<div class="campo">' +
        '<label class="rotulo">Altura da cliente (estatura)</label>' +
        '<div class="grade grade-3">' + botoesEstatura + '</div>' +
        '<p class="hint">A estatura entra na sugestão de corte: as opções mudam para baixa, média e alta.</p>' +
      '</div>' +
      '<ol class="guia-rosto">' +
        '<li>Compare a largura da testa, das maçãs e da mandíbula.</li>' +
        '<li>Compare o comprimento com a largura.</li>' +
        '<li>Trace o contorno e encontre a forma mais próxima.</li>' +
      '</ol>' +
      '<div class="grade grade-2 grade-rosto">' + cards + '</div>' +
      '<p class="hint">Losangular tem quatro pontas (losango); Hexagonal tem seis lados, com testa e mandíbula mais retas.</p>' +
      '<div class="nota"><b>Registro apenas.</b> O que o formato direciona aparece na próxima tela.</div>';

    Array.prototype.forEach.call(el.querySelectorAll('[data-estatura]'), function (botao) {
      botao.addEventListener('click', function () {
        e.estatura = botao.getAttribute('data-estatura');
        ctx.salvar();
        ctx.recarregar();
      });
    });

    Array.prototype.forEach.call(el.querySelectorAll('[data-formato]'), function (botao) {
      botao.addEventListener('click', function () {
        e.formatoRosto = botao.getAttribute('data-formato');
        avancarCom(ctx);
      });
    });
  }

  /* ---------- TELA 9 ---------- */

  function render9(el, ctx) {
    var e = ctx.estado;
    var formato = DADOS.formatoPorId(e.formatoRosto);

    if (!formato) {
      el.innerHTML =
        '<h2>O que o seu formato direciona</h2>' +
        '<section class="cartao cartao-alerta" role="alert">' +
          '<h3>Falta o formato do rosto</h3>' +
          '<p class="texto">Esta leitura depende da forma escolhida na tela 8.</p>' +
          '<button type="button" class="btn btn-secundario" data-acao="ir-8">Ir para o formato do rosto</button>' +
        '</section>';
      var ir8 = el.querySelector('[data-acao="ir-8"]');
      if (ir8) ir8.addEventListener('click', function () { ctx.irPara(8); });
      return;
    }

    var itens = MOTOR.itensDoFormato(formato);

    var itensHtml;
    if (itens.length) {
      itensHtml = '<div class="linhas-leitura">' + itens.map(function (item) {
        return '<div class="linha-leitura">' +
          '<span class="linha-rotulo-texto">' + esc(item.rotulo) + '</span>' +
          '<span class="linha-valor">' + esc(item.texto) + '</span>' +
          '</div>';
      }).join('') + '</div>';
    } else {
      itensHtml = '<p class="texto-suave">A tabela do método não separa corte, franja, repartição, volume ou posição de cor para este formato.</p>';
    }

    el.innerHTML =
      '<h2>O que o seu formato direciona</h2>' +
      '<p class="lead">Leitura do formato <b>' + esc(formato.nome) + '</b>. Nenhum campo a preencher: o que você lê aqui vem da tabela do método.</p>' +
      '<section class="cartao cartao-leitura" aria-labelledby="tituloDirecionamento">' +
        '<p class="sobretitulo" id="tituloDirecionamento">Direcionamento do método</p>' +
        '<p class="direcionamento">' + esc(formato.direcionamento) + '</p>' +
        itensHtml +
      '</section>' +
      '<p class="hint">Abaixo do direcionamento aparecem só os itens que a tabela separa para este formato. O que ela não separa continua dito na frase inteira — o app não inventa direção.</p>' +
      blocoDeCortes(formato, e) +
      '<div class="nota"><b>Leitura, não prescrição.</b> Estas são as direções da tabela do método; a decisão final de corte é da profissional.</div>';
  }

  /* ---------- registro ---------- */

  VISAGE.registrarTela(1, { titulo: 'Quem está na cadeira?', bloco: 'abertura', render: render1 });
  VISAGE.registrarTela(2, { titulo: 'Desejo', bloco: 'abertura', render: render2 });
  VISAGE.registrarTela(3, { titulo: 'Rota', bloco: 'abertura', render: render3 });
  VISAGE.registrarTela(4, { titulo: 'Profundidade da pele', bloco: 'leitura', render: render4 });
  VISAGE.registrarTela(5, { titulo: 'Base natural do cabelo', bloco: 'leitura', render: render5 });
  VISAGE.registrarTela(6, { titulo: 'Cabelos brancos', bloco: 'leitura', render: render6 });
  VISAGE.registrarTela(7, { titulo: 'Contraste', bloco: 'leitura', render: render6Contraste });
  VISAGE.registrarTela(8, { titulo: 'Saúde do fio', bloco: 'leitura', render: render7 });
  VISAGE.registrarTela(9, { titulo: 'Formato do rosto', bloco: 'rosto', render: render8 });
  VISAGE.registrarTela(10, { titulo: 'O que o seu formato direciona', bloco: 'rosto', render: render9 });
})(typeof window !== 'undefined' ? window : this);
