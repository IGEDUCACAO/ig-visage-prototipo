# Pendências do protótipo v2 — núcleo e telas 1 a 9

Este arquivo registra o que o núcleo v2 deixou em aberto de forma consciente. Nada aqui foi
corrigido por conta própria: a regra da Ilda e a ordem do fluxo foram implementadas como estão.

## Para a Ilda decidir

### 1. O contraste ALTO não é alcançável pelo cálculo automático

Implementei a regra da spec v2 (seção 2.2) exatamente como está:

- profundidade da pele: Clara = 1, Média = 2, Profunda = 3;
- altura da base: 01–04 = 1, 05–07 = 2, 08–10 = 3;
- contraste = distância absoluta entre os dois índices;
- distância 0 ou 1 = BAIXO, 2 = MÉDIO, 3 = ALTO.

Com índices de 1 a 3, a distância máxima possível é **2** (1 contra 3). Logo, **o nível ALTO nunca
é produzido pelo cálculo automático** — só aparece por ajuste manual justificado. O teste que
prova isso está em `assets/engine.js`/`assets/data.js` e foi executado: os únicos níveis que o
cálculo devolve são `baixo` e `medio`.

Precisa de decisão: a régua de índices muda (por exemplo, 1..4), a faixa de distância muda, ou o
ALTO permanece exclusivamente como leitura manual da profissional? Não alterei a regra.

### 2. Cor de referência da Matriz de Paletas

A coluna `corReferencia` das 24 variações está vazia, como manda a spec (seção 7 e pendência 5 da
seção 8). As telas 13 e 16, quando existirem, devem exibir as sugestões iniciais com a marcação
“sugestão — validar com a amostra física”. O campo `statusValidacao` da matriz já carrega esse
texto.

### 3. Critério de contraste e sugestões de tom da matriz

Os artefatos consultados não traziam a Matriz v3 completa. Os campos `criterioContraste` e
`sugestoes` de cada variação são **provisórios** e precisam ser conferidos com a matriz oficial
antes de as telas 13 e 16 irem para a cliente.

### 4. Hex das amostras

Cada amostra do v1 trazia apenas o código (por exemplo, `8.34`), sem hex. Os hex registrados em
`assets/data.js` são **direção de tela**, não cor de produto. A decisão se confirma com a amostra
física na mão — essa ressalva já aparece nas telas e deve continuar no dossiê.

### 5. Onde a temperatura é registrada

A tela 10 exibe “Profundidade × temperatura”, mas **nenhuma tela de 1 a 9 coleta temperatura** na
spec v2: a tela 4 passou a ter só a profundidade. No v1 a temperatura era lida junto com a pele,
confirmada no Kit de Tecidos. Sem essa decisão, a família (que cruza profundidade × temperatura)
não pode ser derivada na tela 10 e o roteamento da tela 11 cai no caminho padrão. Decidir: a
temperatura entra na tela 4, na tela 10 ou em uma tela própria?

### 6. Pendências abertas da spec (seção 8)

1. O app será PWA mobile-first ou app nativo?
2. Qual a abordagem de imagens (foto real com simulação ilustrativa) e o custo envolvido?
3. Formato de exportação do dossiê: PDF gerado no app ou template externo?
4. Haverá envio automático por WhatsApp ou apenas download?
5. Preencher a coluna de cor de referência da Matriz de Paletas antes de liberar as telas 13 e 16.
6. Qual é a identidade visual definitiva do app?

## Lacunas da spec preenchidas de forma provisória

- **Tela 9:** a tabela da spec traz uma frase agregada por formato, não cinco campos separados.
  Os campos corte, franja, repartição, volume e posição da cor foram decompostos preservando os
  trechos literais da tabela. Onde a tabela não define o item, a tela mostra “Sem indicação na
  tabela do método” em vez de inventar direção. Confirmar a decomposição com a Ilda.
- **Tela 3:** as frases de consequência de cada rota foram redigidas a partir das descrições da
  spec. Revisar o texto final. O rótulo já respeita a RN-24: Harmonia e Íris usam “prescrita”,
  Estilo usa “proposta”.
- **Tela 7:** a orientação de tratamento é genérica (reconstrução, hidratação, reavaliação) e não
  é um protocolo técnico. Precisa da validação da Ilda antes de virar prescrição de tratamento.
- **Tela 8:** as miniaturas são geométricas, como pedido. A convenção usada foi Triangular = base
  da mandíbula mais larga (por isso a orientação pede volume no topo) e Triângulo invertido =
  testa mais larga e queixo estreito. Losangular é um losango de quatro pontas; Hexagonal tem seis
  lados. Confirmar se a convenção de nomes é a do método.
- **Tela 1:** as três clientes da lista são fictícias, com contato inventado. Nada vem de banco.

## Para as próximas tarefas (telas 10 a 17)

Os arquivos `assets/telas-prescricao.js` (telas 10–13) e `assets/telas-fechamento.js` (telas 14–17)
já estão referenciados no `index.html`; hoje o 404 é tolerado e o roteador mostra o cartão
“Tela N — em construção”.

O que já está pronto para elas:

- `window.VISAGE.registrarTela(n, { titulo, bloco, render(el, ctx) })` funciona antes de `app.js`
  carregar (o registro é feito num stub e preservado).
- `ctx` entrega `estado`, `salvar`, `irPara(n)`, `recarregar`, `atualizar`, `dados` e `motor`.
- O roteador já trata 11 → 12/13 por `rotaDaTela11(familia, teto)`, 12/13 → 14 e o retorno
  condicional pelo histórico.
- `engine.tetoDeClareamento(base, 4)` e `engine.amostrasViaveis(familia, teto)` estão implementados
  e testados.
- `engine.validaEtapa` bloqueia as telas 10 a 17 com “em construção” — essa é a linha que as
  próximas tarefas substituem pelos critérios reais.

O que falta, tela por tela:

- **10 — Família e calibração:** depende da decisão sobre temperatura. Exibir família, calibração
  (contraste baixo/médio → Suave; alto → Intensa), profundidade × temperatura e contraste. O
  rótulo muda com a rota (RN-24).
- **11 — Teto e faixa:** base natural, teto de clareamento, faixa da família, destaque “A altura
  cede, a temperatura não”. O avanço deve usar `rotaDaTela11` (o roteador já chama).
- **12 — Conflito e decisão:** só aparece sem amostra viável. Registrar a decisão com data (RN-20).
  Nunca exibir “toque na amostra”.
- **13 — Escolha da amostra:** só aparece com ao menos uma amostra viável. Filtrar por família e
  teto com `amostrasViaveis`. Nunca renderizar sem amostras. Nota “cor de tela é direção; a decisão
  se confirma com a amostra na mão”.
- **14 — Receita e valores:** receita obrigatória; consultoria e serviço de cor independentes, sem
  soma, total ou sugestão (RN-26).
- **15 — Manutenção e retorno:** plano e data obrigatórios (RN-21), mais cuidados diários e o que
  observar antes de voltar.
- **16 — Paleta de vestuário:** 4 camadas da família a partir de `MATRIZ_PALETAS`, com o texto
  introdutório e o rodapé obrigatórios.
- **17 — Dossiê final:** documento visual com todos os componentes, LGPD quando houver foto e
  saída em PDF (formato ainda pendente). O botão do rodapé nesta tela já foi preparado para
  “Reiniciar demonstração”.

Estados que as próximas telas precisam acrescentar ao prontuário: temperatura, família, calibração,
teto, faixa alcançável, amostra escolhida, decisão de conflito, receita, valores, manutenção, data
de retorno, cuidados diários, o que observar e consentimento LGPD.

## Como verificar este núcleo

```sh
node --check assets/data.js
node --check assets/engine.js
node --check assets/app.js
node --check assets/telas-leitura.js
```

O serviço é estático: basta abrir `index.html` por HTTP a partir da raiz do projeto (GitHub Pages).
O estado fica em `localStorage`, chave `visage.v2`; para limpar, use o próprio navegador ou o botão
“Reiniciar demonstração” quando a tela 17 existir.

## Fora do escopo desta entrega

Sem backend, banco, login, upload de foto ou chamada de IA. Telas 10 a 17 não foram implementadas.
Nenhum servidor de desenvolvimento foi deixado rodando.
