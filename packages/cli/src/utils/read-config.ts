import fs from 'fs';
import path from 'path';
import { FoldaaConfig } from '../types/foldaa-config.js';

export function readFoldaaConfig(cwd: string): FoldaaConfig | null {
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
    
    return parsed as FoldaaConfig;
  } catch (error) {
    console.error(`⚠️ Error reading foldaa.json: ${(error as any).message}`);
    return null;
  }
}
