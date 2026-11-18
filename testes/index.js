/* Entrada agregadora de `node --test testes/`.
   Este build do Node resolve o diretório como módulo em vez de procurar os
   arquivos *.test.js; por isso o diretório precisa de um index. Cada teste
   roda em processo próprio (mesmo isolamento do runner) e a falha de qualquer
   um derruba o agregado. `node --test` sem argumento continua descobrindo os
   arquivos *.test.js diretamente. */
'use strict';

var fs = require('fs');
var path = require('path');
var spawnSync = require('child_process').spawnSync;

var arquivos = fs.readdirSync(__dirname).filter(function (nome) {
  return /\.test\.js$/.test(nome);
}).sort();

if (!arquivos.length) {
  console.error('Nenhum arquivo *.test.js em testes/.');
  process.exitCode = 1;
} else {
  arquivos.forEach(function (nome) {
    var resultado = spawnSync(process.execPath, [path.join(__dirname, nome)], { stdio: 'inherit' });
    var passou = resultado.status === 0;
    if (!passou) process.exitCode = 1;
    console.log((passou ? 'ok' : 'FALHOU') + ' — testes/' + nome);
  });

  console.log(process.exitCode
    ? 'TESTES: ' + arquivos.length + ' arquivos, com falha.'
    : 'TESTES: ' + arquivos.length + ' arquivos, todos passaram.');
}
