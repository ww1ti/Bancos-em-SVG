const fs = require('fs');
const path = require('path');

const bankListPath = 'C:\\Users\\rafae.GN-001\\.gemini\\antigravity\\brain\\203520b4-edf5-4cb9-9bed-9db0d6607d94\\bank_list.txt';
const rootDir = __dirname;
const outputJsonPath = path.join(rootDir, 'banks.json');

// Read the bank list
const bankListContent = fs.readFileSync(bankListPath, 'utf-8');
const banks = [];

bankListContent.split('\n').forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 2) {
        const code = parts[0].trim();
        const name = parts[1].trim();
        banks.push({ code, name });
    }
});

if (!banks.find(b => b.code === '237')) banks.push({ code: '237', name: 'Banco Bradesco S.A.' });
if (!banks.find(b => b.code === '212')) banks.push({ code: '212', name: 'Banco Original S.A.' });
if (!banks.find(b => b.code === '735')) banks.push({ code: '735', name: 'Banco Neon S.A.' });

const directories = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map(dirent => dirent.name);

const bankMap = {};

function tokenize(str) {
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "") // stripped spaces for aggressive matching in manual map
        .split(/\s+/)
        .filter(t => t.length > 0);
}

banks.forEach(b => {
    b.normalizedName = tokenize(b.name).join('');
});

function categorizeImage(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('negativo') || lower.includes('branco') || lower.includes('white') || lower.includes('dark')) return 'negativo';
    if (lower.includes('fundo') || lower.includes('bg') || lower.includes('solid')) return 'fundo';
    if (lower.includes('padrao') || lower.includes('logo') || lower.includes('marca')) return 'padrao';
    return 'variacao';
}

function getVariations(files) {
    const categories = {
        padrao: "",
        fundo: "",
        negativo: "",
        nome: "",
        variacao1: "",
        variacao2: "",
        variacao3: "",
        variacao4: "",
        variacao5: ""
    };

    let variationCount = 1;

    files.forEach(file => {
        if (!file.endsWith('.svg')) return;
        let type = categorizeImage(file);

        if (type === 'padrao' && categories.padrao) type = 'variacao';
        if (type === 'fundo' && categories.fundo) type = 'variacao';
        if (type === 'negativo' && categories.negativo) type = 'variacao';

        if (type === 'variacao') {
            if (variationCount <= 5) {
                categories[`variacao${variationCount}`] = file;
                variationCount++;
            }
        } else {
            categories[type] = file;
        }
    });

    // Fallback: if padrao is empty but we have files, take the first one
    if (!categories.padrao && files.length > 0) {
        // First try unused files
        const used = Object.values(categories).filter(Boolean);
        const available = files.filter(f => f.endsWith('.svg') && !used.includes(f));
        if (available.length > 0) {
            categories.padrao = available[0];
        } else if (categories.variacao1) {
            // If all files are used in variations, just copy variacao1 to padrao
            categories.padrao = categories.variacao1;
        }
    }

    return categories;
}

const dirToBankMap = {};

// Manual Map with normalized keys (no spaces, lowercase)
const manualMap = {
    'bancosantanderbrasilsa': '033',
    'bancobtgpactual': '208',
    'bancobtgpacutal': '208',
    'bnpparipas': '740',
    'abcbrasil': '246',
    'ailos': '085',
    'asaasipsa': '461',
    'bkbank': '250',
    'bancodaycoval': '707',
    'bancoc6sa': '336',
    'bancointer': '077',
    'bancointermedium': '077',
    'nubank': '260',
    'nupagamentossa': '260',
    'bancobmg': '318',
    'bancoindustrialdobrasilsa': '604',
    'bancomercantildobrasilsa': '389',
    'bancmercantildobrasilsa': '389',
    'bancopan': '623',
    'bancopansa': '623',
    'bancopaulista': '611',
    'bancopine': '643',
    'bancorendimento': '633',
    'bancotriangulotribanco': '634',
    'bancovotorantim': '655',
    'bancosofisa': '637',
    'bancotopazio': '082',
    'bancodaamazoniasa': '003',
    'bancodobrasilsa': '001',
    'bancodonordestedobrasilsa': '004',
    'bancodoestadodoespiritosanto': '021',
    'bancodoestadodopara': '037',
    'bancodoestadodosergipe': '047',
    'banrisul': '041',
    'beesbank': '555',
    'bradescosa': '237',
    'bradesco': '237',
    'caixaeconomicafederal': '104',
    'capitual': '901',
    'contasimples': '902',
    'contasimplessolucoesempagamentos': '902',
    'cora': '403',
    'corasociedadecreditodiretosa': '403',
    'credisis': '097',
    'cresol': '133',
    'duepay': '903',
    'efigerencianet': '364',
    'grafeno': '904',
    'ifoodpago': '905',
    'infinitepay': '536',
    'ip4y': '906',
    'itauunibancosa': '341',
    'iugo': '907',
    'letsbanksa': '630',
    'linker': '908',
    'mufg': '456',
    'magalupay': '909',
    'mercadopago': '323',
    'modobank': '910',
    'multiplobank': '911',
    'neon': '735',
    'omiecash': '912',
    'omni': '613',
    'pagsegurointernetsa': '290',
    'paycash': '913',
    'picpay': '380',
    'pinbank': '914',
    'qualitydigitalbank': '915',
    'recargapay': '916',
    'sicoob': '756',
    'sicredi': '748',
    'sisprime': '114',
    'squidsolucoesfinanceiras': '917',
    'starbank': '918',
    'stonepagamentossa': '197',
    'sulcredi': '919',
    'transfera': '920',
    'unicred': '136',
    'uniprime': '099',
    'xpinvestimentos': '102',
    'zemobank': '921',
    'bancovr': '610',
    'bancoguanabara': '612',
    'bancoclassico': '241',
    'bancorodobens': '120',
    'bancoagibank': '121',
    'agibank': '121',
    'itaubba': '184',
    'itauconsignado': '029',
    'itaubank': '479',
    'hipercard': '062',
    'bradescobbi': '036',
    'bradescocartoes': '204',
    'bradescofinanciamentos': '394',
    'bradescard': '063',
    'goldmansachs': '064',
    'jpmorgan': '376',
    'mizuho': '370',
    'sumitomo': '464',
    'caixageral': '473',
    'deutschebank': '487',
    'creditsuisse': '505',
    'bancourinvest': '712',
    'bancoribeiraopreto': '741',
    'bancosemear': '743',
    'bancomodal': '746',
    'rabobank': '747',
    'scotiabank': '751',
    'bankofamerica': '755', // or 755
    'kebhana': '757',
    'brazabank': '128',
    'bancoba': '096'
};

// Auto match first based on list
directories.forEach(dir => {
    let normDir = tokenize(dir).join('');

    // Check manual map first
    if (manualMap[normDir]) {
        dirToBankMap[dir] = manualMap[normDir];
    } else {
        // Try to match against bank list
        const matchedBank = banks.find(b => b.normalizedName === normDir || normDir.includes(b.normalizedName) || b.normalizedName.includes(normDir));
        if (matchedBank) {
            // Refine overlap
            if (normDir.length > 5 && matchedBank.normalizedName.length > 5) {
                dirToBankMap[dir] = matchedBank.code;
            }
        }
    }
});


const finalMap = {};
const unmatchedDirs = [];

Object.keys(dirToBankMap).forEach(dir => {
    const code = dirToBankMap[dir];
    const dirPath = path.join(rootDir, dir);

    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        const images = getVariations(files);

        Object.keys(images).forEach(key => {
            if (key !== 'nome' && images[key]) {
                const encodedDir = encodeURIComponent(dir).replace(/%20/g, '%20'); // redundant but explicit if needed, standard encodeURIComponent handles space
                const encodedFile = encodeURIComponent(images[key]);
                images[key] = `https://raw.githubusercontent.com/ww1ti/Bancos-em-SVG/refs/heads/main/${encodedDir}/${encodedFile}`;
            }
        });

        const bankObj = banks.find(b => b.code === code);
        images.nome = bankObj ? bankObj.name : dir;

        finalMap[code] = images;
    }
});

directories.forEach(dir => {
    if (!dirToBankMap[dir]) unmatchedDirs.push(dir);
});

fs.writeFileSync(outputJsonPath, JSON.stringify(finalMap, null, 2));
console.log(`Generated banks.json with ${Object.keys(finalMap).length} banks.`);
if (unmatchedDirs.length > 0) {
    console.log('Unmatched Directories:');
    unmatchedDirs.forEach(d => console.log(d, `(${tokenize(d).join('')})`));
}
