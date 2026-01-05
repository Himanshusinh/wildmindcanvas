const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node bracket_checker.js <file_path>');
    process.exit(1);
}

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stack = [];
    const brackets = {
        '(': ')',
        '{': '}',
        '[': ']'
    };
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (brackets[char]) {
                stack.push({ char, line: i + 1, col: j + 1 });
            } else if (Object.values(brackets).includes(char)) {
                if (stack.length === 0) {
                    console.error(`Unexpected closing bracket '${char}' at line ${i + 1}, column ${j + 1}`);
                    process.exit(1);
                }
                const last = stack.pop();
                if (brackets[last.char] !== char) {
                    console.error(`Mismatched bracket '${char}' at line ${i + 1}, column ${j + 1}. Expected '${brackets[last.char]}' for '${last.char}' from line ${last.line}, column ${last.col}`);
                    process.exit(1);
                }
            }
        }
    }

    if (stack.length > 0) {
        const last = stack[stack.length - 1];
        console.error(`Unclosed bracket '${last.char}' at line ${last.line}, column ${last.col}`);
        process.exit(1);
    }

    console.log('Brackets are balanced.');
} catch (err) {
    console.error('Error reading file:', err.message);
    process.exit(1);
}
