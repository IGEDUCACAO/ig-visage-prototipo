/* O criterio de pronto da malha executa `cd repo && node --test testes/`.
   Este shim faz esse caminho existir e delega para a suite real em testes/,
   sem duplicar teste nenhum. */
'use strict';

require('../../testes/index.js');
