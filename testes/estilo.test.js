// Identidade oficial: paleta do Manual da Marca e tipografia servida do próprio repo.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(raiz, 'assets/styles.css'), 'utf8');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');

const falhas = [];
function exigir(ok, msg) { if (!ok) falhas.push(msg); }

// 1. Fontes da marca, servidas localmente (nada de CDN).
exigir(css.indexOf('font-family: "Sora"') !== -1 || /font-family:\s*"Sora"/.test(css), 'falta @font-face de Sora');
exigir(/font-family:\s*"BT Suave"/.test(css), 'falta @font-face de BT Suave');
exigir(/url\("marca\/Sora-Regular\.ttf"\)/.test(css), 'Sora-Regular não é servida do repo');
exigir(/url\("marca\/BTSuave-Bold\.otf"\)/.test(css), 'BT Suave Bold não é servida do repo');
exigir(css.indexOf('fonts.googleapis') === -1 && !/url\(\s*["']?https?:/.test(css), 'o CSS usa fonte externa/CDN');
exigir(/--serif:\s*"BT Suave"/.test(css), 'títulos devem usar BT Suave');
exigir(/--sans:\s*"Sora"/.test(css), 'texto deve usar Sora');
exigir(!/--serif:\s*"?Georgia/.test(css), 'a serifada antiga voltou a ser a primeira opção');

// 2. Paleta oficial (Manual da Marca).
const cores = { '--ameixa': '#431C5B', '--vinho': '#8C1F3D', '--terracota': '#DB6A37', '--marinho': '#064276', '--cinza-azulado': '#40535D', '--tinta': '#161F28' };
Object.keys(cores).forEach(function (v) {
  exigir(new RegExp(v + ':\\s*' + cores[v], 'i').test(css), 'paleta: ' + v + ' deveria ser ' + cores[v]);
});

// 3. Arquivos da marca presentes.
['Sora-Regular.ttf', 'Sora-Bold.ttf', 'BTSuave-Bold.otf', 'FilmotypeYale.otf',
 'logo_horizontal_01.png', 'logo_simbolo_01.png'].forEach(function (arq) {
  exigir(fs.existsSync(path.join(raiz, 'assets/marca', arq)), 'falta o arquivo assets/marca/' + arq);
});

// 4. Marca visível na página e nada de pasta repo/ (shim de critério de pronto).
exigir(html.indexOf('assets/marca/') !== -1, 'a página não usa nenhum ativo da marca');
exigir(!fs.existsSync(path.join(raiz, 'repo')), 'sobrou a pasta repo/ (shim de critério de pronto)');

if (falhas.length) {
  console.error('FALHOU:\n- ' + falhas.join('\n- '));
  process.exit(1);
}
console.log('OK — paleta oficial, fontes locais da marca e marca visível na página.');
