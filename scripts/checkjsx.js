import fs from 'fs';

const code = fs.readFileSync('/Users/apple/Desktop/main/raw/Praedico/Praedico-application-2/frontend/src/app/user/_components/RegisterModal.tsx', 'utf-8');
const lines = code.split('\n');

let stack = [];
let lineNum = 1;
for (let i = 240; i < 461; i++) {
    const line = lines[i-1];
    // extremely naive matching
    const opens = (line.match(/<[a-zA-Z]+/g) || []).filter(v => !['<br','<hr','<img','<input','<path','<svg', '<circle', '<line'].includes(v));
    const closes = (line.match(/<\/[a-zA-Z]+/g) || []);
    const selfCloses = (line.match(/<[a-zA-Z]+[^>]*\/>/g) || []).filter(v => !['<br','<hr','<img','<input','<path','<svg','<LocationSelect'].includes(v.split(' ')[0]));
    
    // not perfect but good enough for finding the big mismatch
    console.log(`${i}: ${line.trim()}`);
}
