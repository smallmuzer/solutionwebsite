import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let count = 0;
walkDir('src', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    const transformed = content.replace(/text-\[(\d+)px\]/g, (match, pxVal) => {
        let rem = parseInt(pxVal, 10) / 16;
        return `text-[${rem}rem]`;
    });
    
    if (original !== transformed) {
        fs.writeFileSync(filePath, transformed, 'utf8');
        count++;
        console.log(`Updated ${filePath}`);
    }
});

console.log(`Finished converting px to rem in ${count} files.`);
