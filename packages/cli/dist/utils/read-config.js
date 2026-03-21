import fs from 'fs';
import path from 'path';
export function readFoldaaConfig(cwd) {
    const configPath = path.join(cwd, 'foldaa.json');
    try {
        if (!fs.existsSync(configPath)) {
            return null;
        }
        const data = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(data);
        // Basic validation
        if (!parsed || typeof parsed !== 'object' || !parsed.name) {
            console.warn('⚠️ Invalid foldaa.json: Missing required "name" field.');
            return null;
        }
        return parsed;
    }
    catch (error) {
        console.error(`⚠️ Error reading foldaa.json: ${error.message}`);
        return null;
    }
}
