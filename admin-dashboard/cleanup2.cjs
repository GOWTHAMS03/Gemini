const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/ShopsPage.tsx');
let lines = fs.readFileSync(file, 'utf8').split('\n');

const outLines = [];
let skipBlock = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('totalCreditLimit') || line.includes('nearLimitShops') || line.includes('utilizationPercent') || line.includes('value={formData.creditLimit}') || line.includes('name="creditLimit"')) {
        continue;
    }

    if (line.includes('Total Credit Extended')) {
        outLines.pop(); // remove previous div wrapper
        skipBlock = true;
        continue;
    }
    
    if (line.includes('Credit Limit (₹)')) {
        outLines.pop(); // remove <div>
        skipBlock = true;
        continue;
    }
    
    if (line.includes('{shop.creditLimit.toLocaleString()}')) {
        outLines.push(line.replace(/₹\{shop\.creditLimit\.toLocaleString\(\)\}/g, ''));
        continue;
    }

    if (line.includes('₹{shop.outstanding.toLocaleString()} / ₹{shop.creditLimit.toLocaleString()}')) {
        outLines.push(line.replace(/ \/ ₹\{shop\.creditLimit\.toLocaleString\(\)\}/g, ''));
        continue;
    }

    if (line.includes('{selectedLedgerShop.creditLimit.toLocaleString()}')) {
        continue;
    }

    if (line.includes('{(selectedLedgerShop.creditLimit - selectedLedgerShop.outstanding).toLocaleString()}')) {
        continue;
    }

    if (skipBlock && line.includes('</div>')) {
        skipBlock = false;
        continue;
    }
    if (skipBlock) continue;

    outLines.push(line);
}

fs.writeFileSync(file, outLines.join('\n'));
console.log('Cleaned up remaining credit references in ShopsPage.tsx');
