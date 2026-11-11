/* Tela 17 — Dossiê final.
   O dossiê é um documento visual: capa, diagnóstico, formato, paleta,
   receita, manutenção e termo LGPD. Exporta o construtor para os testes
   em node e registra a tela no navegador. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./data.js'), require('./engine.js'));
  } else {
    root.VISAGE = root.VISAGE || {};
    root.VISAGE_DOSSIE = factory(root.VISAGE_DATA, root.VISAGE_ENGINE);
    if (root.VISAGE_DOSSIE) root.VISAGE_DOSSIE.registrar(root.VISAGE);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (DADOS, MOTOR) {
  'use strict';

  if (!DADOS || !MOTOR) {
    throw new Error('telas-dossie precisa de assets/data.js e assets/engine.js carregados.');
  }

  var CHAVE = 'visage.v2';

  var ROTULO_ROTA = {
    harmonia: 'Harmonia',
    iris: 'Íris',
    estilo: 'Estilo'
  };

  var ROTULO_PROFUNDIDADE = {
    clara: 'Clara',
    media: 'Média',
    profunda: 'Profunda'
  };

  var ROTULO_CONTRASTE = {
    baixo: 'BAIXO',
    medio: 'MÉDIO',
    alto: 'ALTO'
  };

  var DECISOES = {
    'ponto-mais-alto': 'Entregar o ponto mais alto que o fio suporta (mantendo a temperatura da família)',
    'adiar': 'Adiar a cor e tratar o fio primeiro'
  };

  var TEXTOS = {
    semDesejo: 'Desejo não registrado — a cliente seguiu sem verbalizar um desejo.',
    semReceita: 'Receita técnica não registrada.',
    semPlano: 'Plano de manutenção não registrado.',
    semCuidados: 'Cuidados diários não registrados.',
    semObservar: 'Nada registrado sobre o que observar antes de voltar.',
    semRetorno: 'Data de retorno não definida.',
    semFormato: 'Formato de rosto não registrado.',
    semFamilia: 'Família não registrada.',
    semCalibracao: 'Calibração não registrada.',
    semContraste: 'Contraste não registrado.',
    semBase: 'Base natural não registrada.',
    semTeto: 'Teto de clareamento não definido.',
    semFaixa: 'Faixa da família não definida.',
    semPaleta: 'Paleta de vestuário indisponível para a família registrada.'
  };

  function esc(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function texto(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
  }

  function valorOu(valor, vazio) {
    var t = texto(valor);
    return t ? esc(t) : '<span class="dossie-vazio">' + esc(vazio) + '</span>';
  }

  function formatarDataISO(iso) {
    var t = texto(iso);
    var partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (!partes) return '';
    var data = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
    if (Number.isNaN(data.getTime())) return '';
    try {
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (err) {
      return partes[3] + '/' + partes[2] + '/' + partes[1];
    }
  }

  function dataDoAtendimento(estado) {
    return formatarDataISO(estado && estado.dataAtendimento) || 'Data não registrada';
  }

  function baseFormatada(altura) {
    var n = Number(altura);
    if (!Number.isInteger(n) || DADOS.ALTURAS.indexOf(n) === -1) return '';
    return DADOS.formatarAltura(n);
  }

  function familiaDoEstado(estado) {
    return estado ? DADOS.familiaPorSigla(estado.familia) || null : null;
  }

  function calibracaoDoEstado(estado) {
    var registrada = texto(estado && estado.calibracao);
    if (registrada) return registrada;
    if (estado && estado.contraste) {
      return estado.contraste === 'alto' ? 'Intensa' : 'Suave';
    }
    return '';
  }

  function tetoDoEstado(estado, familia) {
    var teto = Number(estado && estado.teto);
    if (Number.isInteger(teto) && DADOS.ALTURAS.indexOf(teto) !== -1) return teto;
    var base = Number(estado && estado.baseNatural);
    if (DADOS.ALTURAS.indexOf(base) === -1) return null;
    return MOTOR.tetoDeClareamento(base, familia ? familia.tetoClareamento : 4);
  }

  function faixaAlcancavelDoEstado(familia, teto) {
    if (!familia || !Array.isArray(familia.faixa) || familia.faixa.length < 2) {
      return '';
    }
    var min = Number(familia.faixa[0]);
    var max = Number(familia.faixa[1]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return '';
    }
    if (teto !== null && teto !== undefined && teto !== '') {
      var tetoNum = Number(teto);
      if (Number.isFinite(tetoNum)) {
        if (tetoNum <= min) {
          return 'até ' + DADOS.formatarAltura(tetoNum);
        }
        if (tetoNum < max) {
          return DADOS.formatarAltura(min) + ' a ' + DADOS.formatarAltura(tetoNum);
        }
      }
    }
    return DADOS.formatarAltura(min) + ' a ' + DADOS.formatarAltura(max);
  }

  function decisaoConflitoDoEstado(estado) {
    if (!estado || !estado.decisaoConflito) return null;
    var raw = estado.decisaoConflito;
    var escolhaId = '';
    var textoEscolha = '';
    if (typeof raw === 'string') {
      escolhaId = raw;
      textoEscolha = DECISOES[raw] || raw;
    } else if (typeof raw === 'object') {
      if (raw.escolha) escolhaId = String(raw.escolha);
      if (raw.rotulo && typeof raw.rotulo === 'string') {
        textoEscolha = raw.rotulo;
      } else if (raw.escolha) {
        textoEscolha = DECISOES[raw.escolha] || String(raw.escolha);
      } else if (raw.texto && typeof raw.texto === 'string') {
        textoEscolha = raw.texto;
      }
    }
    textoEscolha = texto(textoEscolha);
    if (!textoEscolha) return null;
    return {
      escolha: escolhaId,
      texto: textoEscolha
    };
  }

  function amostraDoEstado(estado, familia) {
    if (!estado) return null;
    var bruta = estado.amostra || estado.amostraEscolhida || null;
    if (bruta && typeof bruta === 'object') {
      var codigo = texto(bruta.codigo);
      var nome = texto(bruta.nome);
      var altura = Number(bruta.altura);
      if (codigo || nome) {
        return {
          codigo: codigo,
          nome: nome,
          altura: Number.isInteger(altura) ? altura : null
        };
      }
    }
    if (familia && Array.isArray(familia.amostras)) {
      for (var i = 0; i < familia.amostras.length; i++) {
        var cand = familia.amostras[i];
        if (texto(cand.codigo) === texto(bruta) || texto(cand.nome) === texto(bruta)) {
          return { codigo: cand.codigo, nome: cand.nome, altura: cand.altura };
        }
      }
    }
    return null;
  }

  function fotoRegistrada(estado) {
    if (!estado) return false;
    if (estado.fotoRegistrada === true) return true;
    var foto = estado.foto;
    if (foto && typeof foto === 'object') return foto.registrada === true || foto.autorizada === true;
    return false;
  }

  function linhaDado(rotulo, valor, vazio) {
    var temValor = texto(valor) !== '';
    return '<div class="dossie-dado' + (temValor ? '' : ' dossie-dado-vazio') + '">' +
      '<dt>' + esc(rotulo) + '</dt>' +
      '<dd>' + (temValor ? esc(valor) : esc(vazio || 'não registrado')) + '</dd>' +
      '</div>';
  }

  function camadasDaFamilia(familia) {
    if (!familia) return [];
    return DADOS.CAMADAS.map(function (camada) {
      var registro = null;
      for (var i = 0; i < DADOS.MATRIZ_PALETAS.length; i++) {
        var item = DADOS.MATRIZ_PALETAS[i];
        if (item.familia === familia.sigla && item.camada === camada.id) {
          registro = item;
          break;
        }
      }
      return {
        id: camada.id,
        rotulo: camada.rotuloTela16 || camada.nome,
        sugestoes: registro && Array.isArray(registro.sugestoes) ? registro.sugestoes : []
      };
    });
  }

  function htmlCapa(estado, contexto) {
    var nome = texto(estado.cliente && estado.cliente.nome) || 'Cliente não identificada';
    var contato = texto(estado.cliente && estado.cliente.contato);
    var resumo = [
      contexto.familia ? contexto.familia.nome : '',
      contexto.rotaRotulo,
      contexto.contrasteRotulo
    ].filter(function (parte) { return !!parte; }).join(' · ');

    return '<header class="dossie-capa">' +
      '<p class="dossie-capa-marca">Art Visage Harmonie</p>' +
      '<p class="dossie-capa-sobre">Dossiê de consultoria · método Visage Harmonie</p>' +
      '<h2 class="dossie-capa-nome">' + esc(nome) + '</h2>' +
      '<p class="dossie-capa-data">Atendimento em ' + esc(contexto.dataAtendimento) + '</p>' +
      (contato ? '<p class="dossie-capa-contato">' + esc(contato) + '</p>' : '') +
      '<div class="dossie-capa-fio" aria-hidden="true"></div>' +
      (resumo ? '<p class="dossie-capa-resumo">' + esc(resumo) + '</p>' : '') +
      '</header>';
  }

  function htmlDesejo(estado) {
    var desejo = texto(estado.desejo);
    return '<section class="dossie-secao">' +
      '<h3><span class="dossie-num">01</span> O desejo registrado</h3>' +
      (desejo
        ? '<blockquote class="dossie-desejo">“' + esc(desejo) + '”</blockquote>'
        : '<p class="dossie-nota">' + esc(TEXTOS.semDesejo) + '</p>') +
      '</section>';
  }

  function htmlDiagnostico(contexto) {
    var e = contexto.estado;
    var profundidadeETemperatura = [
      contexto.profundidadeRotulo,
      contexto.familia ? contexto.familia.temperatura : ''
    ].filter(function (parte) { return !!parte; }).join(' · ');

    var decisaoTexto = contexto.decisaoConflito || (decisaoConflitoDoEstado(e) ? decisaoConflitoDoEstado(e).texto : '');
    var decisaoEscolha = contexto.decisaoConflitoEscolha || (decisaoConflitoDoEstado(e) ? decisaoConflitoDoEstado(e).escolha : '');

    return '<section class="dossie-secao">' +
      '<h3><span class="dossie-num">02</span> Diagnóstico</h3>' +
      '<dl class="dossie-grade">' +
      linhaDado('Rota', contexto.rotaRotulo, TEXTOS.semFamilia) +
      linhaDado('Família', contexto.familia ? contexto.familia.nome + ' · ' + contexto.familia.sigla : '', TEXTOS.semFamilia) +
      linhaDado('Calibração', contexto.calibracao, TEXTOS.semCalibracao) +
      linhaDado('Profundidade × temperatura', profundidadeETemperatura, 'não registrado') +
      linhaDado('Contraste', contexto.contrasteRotulo, TEXTOS.semContraste) +
      linhaDado('Base natural', contexto.base ? 'base ' + contexto.base : '', TEXTOS.semBase) +
      linhaDado('Teto de clareamento', contexto.teto ? 'até ' + contexto.teto : '', TEXTOS.semTeto) +
      linhaDado('Faixa alcançável', contexto.faixa, TEXTOS.semFaixa) +
      '</dl>' +
      (contexto.amostra
        ? '<p class="dossie-amostra">Amostra escolhida: <strong>' + esc(contexto.amostra.nome || contexto.amostra.codigo) + '</strong>' +
          (contexto.amostra.codigo ? ' · ' + esc(contexto.amostra.codigo) : '') + '</p>'
        : '') +
      (decisaoTexto
        ? '<p class="dossie-nota dossie-conflito" data-rotulo="DECISÃO DE CONFLITO"' +
          (decisaoEscolha ? ' data-escolha="' + esc(decisaoEscolha) + '"' : '') +
          ' title="Decisão de conflito">DECISAO DE CONFLITO: ' + esc(decisaoTexto) + '</p>'
        : '') +
      (e.contrasteAjuste && texto(e.contrasteAjuste.justificativa)
        ? '<p class="dossie-nota">Ajuste manual do contraste: ' + esc(e.contrasteAjuste.justificativa) + '</p>'
        : '') +
      '</section>';
  }

  function htmlFormato(estado) {
    var formato = estado.formatoRosto ? DADOS.formatoPorId(estado.formatoRosto) : null;
    if (!formato) {
      return '<section class="dossie-secao">' +
        '<h3><span class="dossie-num">03</span> Formato do rosto</h3>' +
        '<p class="dossie-nota">' + esc(TEXTOS.semFormato) + '</p>' +
        '</section>';
    }

    var itens = MOTOR.itensDoFormato(formato);
    return '<section class="dossie-secao">' +
      '<h3><span class="dossie-num">03</span> Formato do rosto</h3>' +
      '<p class="dossie-formato-nome">' + esc(formato.nome) + '</p>' +
      '<p class="dossie-direcionamento">' + esc(formato.direcionamento) + '</p>' +
      (itens.length
        ? '<ul class="dossie-itens">' + itens.map(function (item) {
          return '<li><span>' + esc(item.rotulo) + '</span>' + esc(item.texto) + '</li>';
        }).join('') + '</ul>'
        : '') +
      '</section>';
  }

  function htmlPaleta(contexto) {
    var camadas = camadasDaFamilia(contexto.familia);
    var temSugestoes = camadas.some(function (camada) { return camada.sugestoes.length > 0; });

    return '<section class="dossie-secao">' +
      '<h3><span class="dossie-num">04</span> Paleta de vestuário <small>complemento</small></h3>' +
      '<p class="dossie-intro">Este é o complemento da sua consultoria: as cores de roupa que valorizam você. O protagonista continua sendo o seu cabelo.</p>' +
      (temSugestoes
        ? '<div class="dossie-paleta">' + camadas.map(function (camada) {
          if (!camada.sugestoes.length) return '';
          return '<div class="dossie-paleta-bloco dossie-paleta-' + esc(camada.id) + '">' +
            '<p class="dossie-paleta-titulo">' + esc(camada.rotulo) + '</p>' +
            '<ul>' + camada.sugestoes.map(function (cor) {
              return '<li>' + esc(cor) + '</li>';
            }).join('') + '</ul>' +
            '</div>';
        }).join('') + '</div>'
        : '<p class="dossie-nota">' + esc(TEXTOS.semPaleta) + '</p>') +
      '<p class="dossie-rodape-paleta">Orientação de vestuário — não é consultoria de imagem.</p>' +
      '</section>';
  }

  function htmlReceita(estado) {
    var receita = texto(estado.receita || estado.receitaTecnica);
    var consultoria = texto(estado.valorConsultoria);
    var servico = texto(estado.valorCor || estado.valorServico);

    return '<section class="dossie-secao">' +
      '<h3><span class="dossie-num">05</span> Receita técnica</h3>' +
      (receita
        ? '<p class="dossie-receita">' + esc(receita) + '</p>'
        : '<p class="dossie-nota">' + esc(TEXTOS.semReceita) + '</p>') +
      (consultoria || servico
        ? '<dl class="dossie-valores">' +
          (consultoria ? '<div><dt>Valor da consultoria</dt><dd>R$ ' + esc(consultoria) + '</dd></div>' : '') +
          (servico ? '<div><dt>Valor do serviço de cor</dt><dd>R$ ' + esc(servico) + '</dd></div>' : '') +
          '</dl>' +
          '<p class="dossie-nota">Os dois valores são independentes: não são somados nem totalizados.</p>'
        : '') +
      '</section>';
  }

  function htmlManutencao(estado) {
    var plano = texto(estado.manutencao || estado.planoManutencao);
    var cuidados = texto(estado.cuidadosDiarios || estado.cuidados);
    var observar = texto(estado.observar || estado.oQueObservar);
    var retorno = formatarDataISO(estado.dataRetorno);

    return '<section class="dossie-secao">' +
      '<h3><span class="dossie-num">06</span> Manutenção e retorno</h3>' +
      '<dl class="dossie-manutencao">' +
      '<div><dt>Plano de manutenção</dt><dd>' + (plano ? esc(plano) : '<span class="dossie-vazio">' + esc(TEXTOS.semPlano) + '</span>') + '</dd></div>' +
      '<div><dt>Cuidados diários</dt><dd>' + (cuidados ? esc(cuidados) : '<span class="dossie-vazio">' + esc(TEXTOS.semCuidados) + '</span>') + '</dd></div>' +
      '<div><dt>O que observar antes de voltar</dt><dd>' + (observar ? esc(observar) : '<span class="dossie-vazio">' + esc(TEXTOS.semObservar) + '</span>') + '</dd></div>' +
      '</dl>' +
      '<p class="dossie-retorno">' + (retorno
        ? 'Retorno previsto para <strong>' + esc(retorno) + '</strong>.'
        : '<span class="dossie-vazio">' + esc(TEXTOS.semRetorno) + '</span>') + '</p>' +
      '</section>';
  }

  function htmlTermo(contexto) {
    var temFoto = contexto.fotoRegistrada;
    var status = temFoto
      ? 'A cliente possui foto registrada nesta consultoria; a autorização abaixo é aplicável.'
      : 'Não aplicável nesta consultoria: não há foto da cliente registrada no prontuário. A cláusula permanece no documento para os casos em que houver registro de imagem.';

    return '<section class="dossie-secao dossie-termo">' +
      '<h3><span class="dossie-num">07</span> Termo de autorização de uso de imagem</h3>' +
      '<p class="dossie-termo-status">' + esc(status) + '</p>' +
      '<p class="dossie-termo-clausula">Autorizo o uso das imagens do meu rosto e cabelo, captadas durante esta consultoria, exclusivamente para registro técnico do método Visage Harmonie e acompanhamento da evolução do meu atendimento. A autorização é dada nos termos da Lei nº 13.709/2018 (LGPD) e pode ser revogada por escrito a qualquer momento, sem prejuízo dos serviços já prestados. As imagens não serão cedidas a terceiros nem usadas em publicidade sem nova autorização específica.</p>' +
      '<div class="dossie-assinaturas">' +
      '<div class="dossie-assinatura"><span class="dossie-linha-assinatura" aria-hidden="true"></span><p>Assinatura da cliente</p></div>' +
      '<div class="dossie-assinatura"><span class="dossie-linha-assinatura" aria-hidden="true"></span><p>Assinatura da profissional</p></div>' +
      '</div>' +
      '<p class="dossie-termo-data">' + esc(contexto.dataAtendimento) + '</p>' +
      '</section>';
  }

  function htmlAcoes() {
    return '<div class="dossie-acoes" role="group" aria-label="Ações do dossiê">' +
      '<button type="button" class="btn btn-primario" data-acao="gerar-pdf">Gerar PDF</button>' +
      '<button type="button" class="btn btn-secundario" data-acao="reiniciar">Reiniciar demonstração</button>' +
      '</div>' +
      '<p class="dossie-status" data-papel="status-dossie" role="status" aria-live="polite"></p>';
  }

  var CSS_DOSSIE = [
    '<style>',
    '.dossie { max-width: 760px; margin: 0 auto; border: 1px solid var(--line-forte); border-radius: 20px; overflow: hidden; background: var(--card); box-shadow: var(--shadow-alto); }',
    '.dossie-capa { padding: 38px 30px 30px; background: radial-gradient(circle at 82% 12%, rgba(169,133,90,.28), transparent 46%), linear-gradient(160deg, #292320 0%, #1c1815 100%); color: #f5ede1; }',
    '.dossie-capa-marca { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: #d6b98e; }',
    '.dossie-capa-sobre { margin: 6px 0 26px; font-size: 12px; letter-spacing: .04em; color: rgba(245,237,225,.7); }',
    '.dossie .dossie-capa-nome { margin: 0; font-family: var(--serif); font-size: clamp(30px, 7vw, 44px); font-weight: 400; line-height: 1.1; letter-spacing: -.01em; color: #f7efe2; }',
    '.dossie-capa-data { margin: 12px 0 0; font-size: 13.5px; color: #e6d6bd; }',
    '.dossie-capa-contato { margin: 4px 0 0; font-size: 12.5px; color: rgba(245,237,225,.68); }',
    '.dossie-capa-fio { width: 56px; height: 1px; margin: 24px 0 18px; background: linear-gradient(90deg, #d6b98e, transparent); }',
    '.dossie-capa-resumo { margin: 0; font-size: 11.5px; letter-spacing: .12em; text-transform: uppercase; color: #cdae82; }',
    '.dossie-secao { padding: 26px 30px; border-top: 1px solid #eee4d5; break-inside: avoid; }',
    '.dossie-secao:first-of-type { border-top: 0; }',
    '.dossie-secao h3 { display: flex; align-items: baseline; gap: 10px; margin: 0 0 16px; font-family: var(--serif); font-size: 20px; font-weight: 400; color: var(--ink); }',
    '.dossie-secao h3 small { font-family: var(--sans); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); }',
    '.dossie-num { font-family: var(--sans); font-size: 10.5px; font-weight: 700; letter-spacing: .12em; color: var(--gold); }',
    '.dossie-desejo { margin: 0; padding: 14px 18px; border-left: 2px solid var(--gold); background: #fbf6ec; font-family: var(--serif); font-style: italic; font-size: 16px; line-height: 1.55; color: #4a3a2a; }',
    '.dossie-nota { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--ink3); }',
    '.dossie-vazio { color: #94836f; font-style: italic; }',
    '.dossie-grade { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 22px; margin: 0; }',
    '.dossie-dado { padding-bottom: 10px; border-bottom: 1px dashed #e9ddcc; }',
    '.dossie-dado dt { margin: 0 0 3px; font-size: 9.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--label); }',
    '.dossie-dado dd { margin: 0; font-size: 14px; line-height: 1.4; color: var(--ink); }',
    '.dossie-dado-vazio dd { color: #94836f; font-style: italic; }',
    '.dossie-amostra { margin: 16px 0 0; font-size: 12.5px; color: var(--ink2); }',
    '.dossie-conflito { margin: 12px 0 0; }',
    '.dossie-formato-nome { margin: 0 0 6px; font-family: var(--serif); font-size: 24px; color: var(--ink); }',
    '.dossie-direcionamento { margin: 0 0 14px; font-family: var(--serif); font-style: italic; font-size: 15px; line-height: 1.55; color: #4a3a2a; }',
    '.dossie-itens { margin: 0; padding: 0; list-style: none; }',
    '.dossie-itens li { padding: 8px 0; border-top: 1px dashed #e9ddcc; font-size: 13px; line-height: 1.45; color: var(--ink); }',
    '.dossie-itens span { display: inline-block; min-width: 104px; font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--label); }',
    '.dossie-intro { margin: 0 0 16px; font-size: 13px; line-height: 1.55; color: var(--ink2); }',
    '.dossie-paleta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }',
    '.dossie-paleta-bloco { padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: #fdfaf4; }',
    '.dossie-paleta-titulo { margin: 0 0 8px; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--label); }',
    '.dossie-paleta ul { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }',
    '.dossie-paleta li { padding: 4px 9px; border: 1px solid var(--line); border-radius: 999px; background: #fff; font-size: 11.5px; color: var(--ink2); }',
    '.dossie-paleta-cores-a-evitar li { border-style: dashed; color: #8a6a5a; }',
    '.dossie-rodape-paleta { margin: 14px 0 0; font-size: 10.5px; letter-spacing: .04em; color: var(--ink3); }',
    '.dossie-receita { margin: 0; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: #fbf6ec; font-size: 13.5px; line-height: 1.6; color: var(--ink); white-space: pre-wrap; }',
    '.dossie-valores { display: flex; flex-wrap: wrap; gap: 20px; margin: 14px 0 0; }',
    '.dossie-valores dt { font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--label); }',
    '.dossie-valores dd { margin: 3px 0 0; font-family: var(--serif); font-size: 18px; color: var(--ink); }',
    '.dossie-manutencao { display: grid; gap: 12px; margin: 0; }',
    '.dossie-manutencao dt { margin: 0 0 3px; font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--label); }',
    '.dossie-manutencao dd { margin: 0; font-size: 13px; line-height: 1.55; color: var(--ink); }',
    '.dossie-retorno { margin: 16px 0 0; padding-top: 12px; border-top: 1px solid #eee4d5; font-size: 13px; color: var(--ink2); }',
    '.dossie-retorno strong { color: var(--terra-d); }',
    '.dossie-termo { background: #fcfaf5; }',
    '.dossie-termo-status { margin: 0 0 12px; padding: 9px 12px; border-radius: 9px; background: #f3ecdf; font-size: 11.5px; line-height: 1.5; color: #6b5843; }',
    '.dossie-termo-clausula { margin: 0; font-size: 11.5px; line-height: 1.7; color: var(--ink2); text-align: justify; }',
    '.dossie-assinaturas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px; margin-top: 38px; }',
    '.dossie-linha-assinatura { display: block; height: 1px; margin-bottom: 7px; background: #b9a88f; }',
    '.dossie-assinatura p { margin: 0; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink3); }',
    '.dossie-termo-data { margin: 22px 0 0; font-size: 11px; color: var(--ink3); }',
    '.dossie-acoes { display: flex; flex-wrap: wrap; gap: 10px; margin: 18px 0 0; }',
    '.dossie-acoes .btn { flex: 1 1 200px; }',
    '.dossie-status { min-height: 18px; margin: 10px 0 0; font-size: 12px; line-height: 1.45; color: var(--perigo); }',
    '@media (max-width: 520px) { .dossie-capa, .dossie-secao { padding-left: 20px; padding-right: 20px; } .dossie-grade, .dossie-paleta, .dossie-assinaturas { grid-template-columns: 1fr; } .dossie-itens span { display: block; min-width: 0; margin-bottom: 2px; } }',
    '</style>'
  ].join('\n');

  function montarDossie(estadoBruto) {
    var estado = estadoBruto && typeof estadoBruto === 'object' ? estadoBruto : {};
    var familia = familiaDoEstado(estado);
    var base = baseFormatada(estado.baseNatural);
    var teto = tetoDoEstado(estado, familia);
    var decisaoConflito = decisaoConflitoDoEstado(estado);
    var contexto = {
      estado: estado,
      familia: familia,
      rotaRotulo: ROTULO_ROTA[estado.rota] || '',
      calibracao: calibracaoDoEstado(estado),
      profundidadeRotulo: ROTULO_PROFUNDIDADE[estado.profundidade] || '',
      contrasteRotulo: ROTULO_CONTRASTE[estado.contraste] || '',
      base: base,
      teto: teto === null ? '' : DADOS.formatarAltura(teto),
      faixa: faixaAlcancavelDoEstado(familia, teto),
      decisaoConflito: decisaoConflito ? decisaoConflito.texto : '',
      decisaoConflitoEscolha: decisaoConflito ? decisaoConflito.escolha : '',
      amostra: amostraDoEstado(estado, familia),
      fotoRegistrada: fotoRegistrada(estado),
      dataAtendimento: dataDoAtendimento(estado)
    };

    return '<article class="dossie" role="document" aria-label="Dossiê final da consultoria">' +
      htmlCapa(estado, contexto) +
      htmlDesejo(estado) +
      htmlDiagnostico(contexto) +
      htmlFormato(estado) +
      htmlPaleta(contexto) +
      htmlReceita(estado) +
      htmlManutencao(estado) +
      htmlTermo(contexto) +
      '</article>' +
      htmlAcoes();
  }

  function montarTela(estado) {
    return CSS_DOSSIE + montarDossie(estado);
  }

  function mensagemNaTela(el, texto, classe) {
    var alvo = el && typeof el.querySelector === 'function' ? el.querySelector('[data-papel="status-dossie"]') : null;
    if (!alvo) return;
    alvo.textContent = texto;
    if (classe) alvo.setAttribute('data-tom', classe);
  }

  function reiniciarDemonstracao(el) {
    try {
      if (root.VISAGE && typeof root.VISAGE.reiniciar === 'function') {
        root.VISAGE.reiniciar();
        return;
      }
      if (root.localStorage) root.localStorage.removeItem(CHAVE);
      if (root.location && typeof root.location.reload === 'function') {
        root.location.reload();
        return;
      }
      mensagemNaTela(el, 'Não foi possível reiniciar: armazenamento e recarga indisponíveis neste navegador.');
    } catch (err) {
      mensagemNaTela(el, 'Falha ao reiniciar a demonstração: ' + (err && err.message ? err.message : err));
    }
  }

  function imprimirDossie(el) {
    try {
      if (typeof root.print !== 'function') {
        mensagemNaTela(el, 'Este navegador não expõe a impressão. Use o menu do navegador para salvar o dossiê em PDF.');
        return;
      }
      mensagemNaTela(el, '');
      root.print();
    } catch (err) {
      mensagemNaTela(el, 'Falha ao abrir a impressão: ' + (err && err.message ? err.message : err));
    }
  }

  function render(el, ctx) {
    var estado = ctx && ctx.estado ? ctx.estado : {};
    el.innerHTML = montarTela(estado);

    var gerar = el.querySelector('[data-acao="gerar-pdf"]');
    if (gerar) {
      gerar.addEventListener('click', function () { imprimirDossie(el); });
    }

    var reiniciar = el.querySelector('[data-acao="reiniciar"]');
    if (reiniciar) {
      reiniciar.addEventListener('click', function () { reiniciarDemonstracao(el); });
    }
  }

  function registrar(VISAGE) {
    var alvo = VISAGE || (typeof root !== 'undefined' ? root.VISAGE : null);
    if (!alvo) return null;

    if (typeof alvo.registrarTela !== 'function') {
      alvo.telas = alvo.telas || {};
      alvo.registrarTela = function (n, definicao) { alvo.telas[n] = definicao; };
    }
    alvo.telas = alvo.telas || {};

    var definicao = {
      titulo: 'Dossiê final',
      bloco: 'fechamento',
      render: render
    };
    alvo.registrarTela(17, definicao);
    return definicao;
  }

  return {
    titulo: 'Dossiê final',
    montarDossie: montarDossie,
    montarTela: montarTela,
    render: render,
    registrar: registrar
  };
});
