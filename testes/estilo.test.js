// Identidade visual oficial: paleta do Manual da Marca e tipografia servida do repo.
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(raiz, 'assets/styles.css'), 'utf8');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');

const falhas = [];
function exigir(ok, msg) { if (!ok) falhas.push(msg); }

// 1. Fontes da marca declaradas e apontando para os arquivos locais.
['Sora', 'BT Suave'].forEach(function (familia) {
  exigir(css.indexOf('font-family: "' + familia + '"') !== -1, 'falta @font-face de ' + familia);
});
exigir(/url\("marca\/Sora-Regular\.ttf"\)/.test(css), 'Sora-Regular não é servida do repo');
exigir(/url\("marca\/BTSuave-Bold\.otf"\)/.test(css), 'BT Suave Bold não é servida do repo');
exigir(css.indexOf('fonts.googleapis') === -1 && !/url\(\s*["']?https?:/.test(css), 'o CSS usa fonte externa/CDN');
exigir(/--serif:\s*"BT Suave"/.test(css), 'títulos devem usar BT Suave');
exigir(/--sans:\s*"Sora"/.test(css), 'texto deve usar Sora');
exigir(css.indexOf('Georgia, "Times New Roman"') === -1, 'sobrou a serifada antiga como primeira opção');

// 2. Paleta oficial (Manual da Marca).
const cores = {
  '--roxo': '#431C5B', '--vinho': '#8C1F3D', '--laranja': '#DB6A37',
  '--azul': '#064276', '--ink': '#161F28'
};
Object.keys(cores).forEach(function (v) {
  const re = new RegExp(v + ':\\s*' + cores[v], 'i');
  exigir(re.test(css), 'paleta: ' + v + ' deveria ser ' + cores[v]);
});
exigir(css.indexOf('--gold: #431C5B') !== -1, 'o dourado antigo deveria apontar para o roxo da marca');

// 3. Arquivos da marca presentes.
['Sora-Regular.ttf', 'Sora-Bold.ttf', 'BTSuave-Bold.otf', 'FilmotypeYale.otf',
 'logo_horizontal_01.png', 'logo_central_01.png'].forEach(function (arq) {
  exigir(fs.existsSync(path.join(raiz, 'assets/marca', arq)), 'falta o arquivo assets/marca/' + arq);
});

// 4. Logo no cabeçalho e nada de pasta repo/ (shim de verify).
exigir(html.indexOf('logo_horizontal_01.png') !== -1, 'o cabeçalho não usa o logo oficial');
exigir(!fs.existsSync(path.join(raiz, 'repo')), 'sobrou a pasta repo/ (shim de critério de pronto)');

if (falhas.length) {
  console.error('FALHOU:\n- ' + falhas.join('\n- '));
  process.exit(1);
}
console.log('OK — paleta oficial aplicada, fontes servidas do repo e logo no cabeçalho.');
