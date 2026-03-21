const fs = require('fs');
const path = require('path');

const directory = '/Users/workspace/FoldaaWeb/apps';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Backgrounds
    content = content.replace(/bg-\[\#070707\]/g, 'bg-black');
    content = content.replace(/bg-\[\#141415\]/g, 'bg-black');
    content = content.replace(/\#141415/g, '#000000');

    // 2. Cyan -> Fuchsia
    content = content.replace(/cyan-500/g, 'fuchsia-500');
    content = content.replace(/cyan-400/g, 'fuchsia-400');
    content = content.replace(/cyan-600/g, 'fuchsia-600');
    
    // Explicit hex replacement for the cyan brand color
    // Use regex with global/case-insensitive flags
    content = content.replace(/#3AC9C0/ig, '#D946EF'); 

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated colors in ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (fullPath.includes('node_modules') || fullPath.includes('.next')) continue;
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
            replaceInFile(fullPath);
        }
    }
}

processDirectory(directory);
console.log("Done replacing theme colors.");
