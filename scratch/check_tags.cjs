const fs = require('fs');
const content = fs.readFileSync('src/components/contratos/ContratoForm.tsx', 'utf8');

let openTags = [];
const regex = /<(\/?[a-zA-Z0-9]+)(\s|>)/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    if (tag.startsWith('/')) {
        const closing = tag.slice(1);
        const last = openTags.pop();
        if (last !== closing) {
            console.error(`Mismatch: Closed </${closing}> but expected </${last}> at around characters ${match.index}`);
        }
    } else if (!tag.includes('/') && !['img', 'input', 'br', 'hr', 'link', 'meta'].includes(tag.toLowerCase())) {
        openTags.push(tag);
    }
}

if (openTags.length > 0) {
    console.error(`Unclosed tags: ${openTags.join(', ')}`);
} else {
    console.log('Tags are balanced!');
}
