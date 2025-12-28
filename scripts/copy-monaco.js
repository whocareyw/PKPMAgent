import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, '../node_modules/monaco-editor/min/vs');
const dest = path.join(__dirname, '../public/monaco/vs');

console.log(`Copying Monaco Editor assets from ${src} to ${dest}...`);

if (!fs.existsSync(src)) {
  console.error(`Error: Source directory ${src} does not exist. Please run 'npm install monaco-editor' first.`);
  process.exit(1);
}

try {
    // Ensure destination directory exists
    if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.mkdirSync(dest, { recursive: true });

    // Copy files
    fs.cpSync(src, dest, { recursive: true });

    console.log('Monaco Editor assets copied successfully.');
} catch (err) {
    console.error('Error copying files:', err);
    process.exit(1);
}
