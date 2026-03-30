
const fs = require('fs');
const content = fs.readFileSync('/Users/workspace/FoldaaWeb/supabase/functions/deploy-project/index.ts', 'utf8');

let braceStack = [];
let inString = false;
let quoteChar = '';

const lines = content.split('\n');

for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    for (let charNum = 0; charNum < line.length; charNum++) {
        const char = line[charNum];
        if (char === '"' || char === "'" || char === "`") {
            if (!inString) {
                inString = true;
                quoteChar = char;
            } else if (quoteChar === char) {
                if (line[charNum-1] !== '\\') {
                    inString = false;
                }
            }
        }
        if (!inString) {
            if (char === '{') braceStack.push({ line: lineNum + 1, char: charNum + 1 });
            if (char === '}') {
                if (braceStack.length === 0) {
                    console.log(`Extra closing brace at ${lineNum + 1}:${charNum + 1}`);
                } else {
                    braceStack.pop();
                }
            }
        }
    }
}

if (braceStack.length > 0) {
    console.log('Unclosed braces at:');
    braceStack.forEach(b => console.log(`Line ${b.line}:${b.char}`));
} else {
    console.log('All braces closed!');
}
