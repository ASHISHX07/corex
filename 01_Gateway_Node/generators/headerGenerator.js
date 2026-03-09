import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const layoutPath = path.resolve(__dirname, '../../Config/shm_layout.json');
const layout = JSON.parse(readFileSync(layoutPath, 'utf8'));
const nodeBufferHeader = path.join(__dirname, '../bridge/headers/optionChainBufferHeader.hpp');
const cppBufferHeader = path.join(__dirname, '../../03_Core_Cpp/headers/bufferHeaders.hpp');

export default async function headerGenerator() {
    let hppContent = `#ifndef BUFFER_HEADER_H\n#define BUFFER_HEADER_H\n\n`;
    
    for (const [key, fields] of Object.entries(layout)) {
        const structName = key.charAt(0) + key.slice(1).toLowerCase();
        const type = (key === "CONTROLLER") ? "int" : "double";
    
        hppContent += `struct ${structName}BufferHeader {\n`;
        fields.forEach(field => {
            hppContent += `    ${type} ${field};\n`;
        });
        hppContent += `};\n\n`;
    }

    hppContent += `#endif // BUFFER_HEADER_H`;
    writeFileSync(nodeBufferHeader, hppContent, 'utf8');
    writeFileSync(cppBufferHeader, hppContent, 'utf8');
    console.log("[BUILD] C++ Headers updated from JSON layout");
}
