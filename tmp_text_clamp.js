const fs = require('fs');
const path = require('path');

const directory = '/Users/workspace/FoldaaWeb/apps/terminal-ui/src/';

const classMapping = {
    // 12px and under
    'text-\\[9px\\]': 'text-xs',
    'text-\\[10px\\]': 'text-xs',
    'text-\\[11px\\]': 'text-xs',
    'text-\\[12px\\]': 'text-xs',
    // 13-14px
    'text-\\[13px\\]': 'text-sm',
    'text-\\[14px\\]': 'text-sm',
    // 15-16px
    'text-\\[15px\\]': 'text-base',
    'text-\\[16px\\]': 'text-base',
    // 17-18px
    'text-\\[17px\\]': 'text-lg',
    'text-\\[18px\\]': 'text-lg',
    // >18px
    'text-\\[19px\\]': 'text-lg',
    'text-\\[20px\\]': 'text-lg',
    'text-\\[22px\\]': 'text-lg',
    'text-\\[24px\\]': 'text-lg',
    'text-\\[28px\\]': 'text-lg',
    'text-\\[32px\\]': 'text-lg',
    'text-\\[36px\\]': 'text-lg',
    'text-\\[40px\\]': 'text-lg',
    'text-\\[48px\\]': 'text-lg',
    'text-[48px]': 'text-lg',
    'text-xl': 'text-lg',
    'text-2xl': 'text-lg',
    'text-3xl': 'text-lg',
    'text-4xl': 'text-lg',
    'text-5xl': 'text-lg',
    'text-6xl': 'text-lg',
    'text-7xl': 'text-lg',
    'text-8xl': 'text-lg',
    'text-9xl': 'text-lg',
};

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            const keys = Object.keys(classMapping).sort((a, b) => b.length - a.length);

            for (const key of keys) {
                // To avoid lookbehind errors in some cases, just use global replace with boundary on standard classes,
                // and for brackets, just replace the exact string since they are usually space-separated or quote-separated.
                // A simpler regex: match whitespace/quotes before, and whitespace/quotes after
                
                // Escape key if it has brackets
                const escapedKey = key.replace(/\[/g, '\\\\[').replace(/\]/g, '\\\\]');
                const regexStr = '(?<=[\\s\'"\`])' + key + '(?=[\\s\'"\`])';
                try {
                   const regex = new RegExp(regexStr, 'g');
                   content = content.replace(regex, classMapping[key]);
                } catch(e) {
                   // Fallback if regex fails
                   content = content.split(key).join(classMapping[key]);
                }
            }

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDirectory(directory);
console.log("Done updating text classes.");
