const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/ShopsPage.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const totalCreditLimit = [^\n]+\n/g, '');
content = content.replace(/const nearLimitShops = [^\n]+\n/g, '');
content = content.replace(/if \(creditFilter === 'NEAR_LIMIT'\) [^\n]+\n/g, '');

content = content.replace(/<div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-\[#F1F3F5\] dark:border-slate-700 shadow-sm flex flex-col justify-between">[\s\S]*?Total Credit Extended[\s\S]*?<\/div>\s*<\/div>/g, '');

content = content.replace(/const utilizationPercent = Math.min\(100, Math.round\(\(shop.outstanding \/ shop.creditLimit\) \* 100\)\);/g, '');
content = content.replace(/<div className="flex justify-between text-\[10px\] font-semibold text-slate-500 dark:text-slate-400 mb-1\.5">[\s\S]*?utilizationPercent[\s\S]*?<\/div>\s*<div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1\.5 overflow-hidden">[\s\S]*?<\/div>/g, '');

content = content.replace(/<div className="text-xs text-\[#8C8C8C\] dark:text-slate-400 font-medium">Total Credit Limit<\/div>\s*<div className="text-base font-extrabold text-\[#1C1C1C\] dark:text-white">₹\{selectedLedgerShop\.creditLimit\.toLocaleString\(\)\}<\/div>/g, '');

content = content.replace(/<div className="text-xs text-\[#8C8C8C\] dark:text-slate-400 font-medium mt-1">Available Credit<\/div>\s*<div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">[\s\S]*?<\/div>/g, '');

content = content.replace(/<div>\s*<label className=\{labelClass\}>Credit Limit \(₹\)<\/label>\s*<input[^>]+name="creditLimit"[^>]+>\s*<\/div>/g, '');

fs.writeFileSync(file, content);
console.log('Cleaned up credit limit references in ShopsPage.tsx');
