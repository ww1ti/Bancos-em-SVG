const fs = require('fs');
const path = require('path');
const https = require('https');

const banksPath = path.join(__dirname, 'banks.json');
const brokenLinksPath = path.join(__dirname, 'broken_links.json');

const banks = JSON.parse(fs.readFileSync(banksPath, 'utf8'));
const urlsToCheck = [];

// Extract URLs
Object.keys(banks).forEach(code => {
    const images = banks[code];
    Object.keys(images).forEach(key => {
        const url = images[key];
        if (key !== 'nome' && url && url.startsWith('http')) {
            urlsToCheck.push({ code, key, url });
        }
    });
});

console.log(`Checking ${urlsToCheck.length} URLs...`);

const brokenLinks = [];
let completed = 0;
const concurrentLimit = 20;

function checkUrl(item) {
    return new Promise((resolve) => {
        const req = https.request(item.url, { method: 'HEAD' }, (res) => {
            if (res.statusCode >= 400) {
                console.log(`[${res.statusCode}] Broken: ${item.url}`);
                brokenLinks.push({ ...item, status: res.statusCode });
            } else {
                // console.log(`[${res.statusCode}] OK: ${item.url}`);
            }
            resolve();
        });

        req.on('error', (e) => {
            console.log(`[Error] ${e.message}: ${item.url}`);
            brokenLinks.push({ ...item, error: e.message });
            resolve();
        });

        req.end();
    });
}

async function runBatch() {
    for (let i = 0; i < urlsToCheck.length; i += concurrentLimit) {
        const batch = urlsToCheck.slice(i, i + concurrentLimit);
        await Promise.all(batch.map(checkUrl));
        completed += batch.length;
        process.stdout.write(`\rProgress: ${Math.min(completed, urlsToCheck.length)}/${urlsToCheck.length}`);
    }
    console.log('\nDone.');
    fs.writeFileSync(brokenLinksPath, JSON.stringify(brokenLinks, null, 2));
    console.log(`Found ${brokenLinks.length} broken links. Saved to broken_links.json`);
}

runBatch();
