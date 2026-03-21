import fs from 'fs';
import path from 'path';
import os from 'os';

const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.foldaa');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');

export interface GlobalConfig {
  apiKey?: string;
  refreshToken?: string;
}

export function getGlobalConfig(): GlobalConfig {
  try {
    if (!fs.existsSync(GLOBAL_CONFIG_FILE)) return {};
    const data = fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

export function saveGlobalConfig(config: Partial<GlobalConfig>) {
  if (!fs.existsSync(GLOBAL_CONFIG_DIR)) {
    fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
  }
  const current = getGlobalConfig();
  const updated = { ...current, ...config };
  fs.writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(updated, null, 2));
}

export function clearGlobalConfig() {
  if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
    fs.unlinkSync(GLOBAL_CONFIG_FILE);
  }
}

export function isLocalDev(): boolean {
  return !!process.env.FOLDAA_API_URL?.includes('localhost') || 
         (!process.env.FOLDAA_API_URL && process.cwd().includes('FoldaaWeb'));
}

export function getBaseURL(): string {
  if (isLocalDev()) {
    return 'http://localhost:3000/api/foldaa'; // Point to the catch-all API
  }
  return process.env.FOLDAA_API_URL || 'https://api.foldaa.com';
}

export function getWebAppURL(): string {
  if (isLocalDev()) {
    return 'http://localhost:3000';
  }
  return 'https://foldaa.com';
}
