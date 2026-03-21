import { FoldaaClient } from '@foldaa/api-client';
import { getGlobalConfig, saveGlobalConfig } from './utils/config.js';

export const getContext = async () => {
  const config = getGlobalConfig();
  const apiKey = process.env.FOLDAA_API_KEY || config.apiKey;
  const refreshToken = process.env.FOLDAA_REFRESH_TOKEN || config.refreshToken;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hueirgbgitrhqoopfxcu.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZWlyZ2JnaXRyaHFvb3BmeGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzkxNDIsImV4cCI6MjA2NDIxNTE0Mn0.AnBtCG1lO3RYYSjxuE4qFbLu-f_WO8va2mrG1DApwM0';

  if (!apiKey) {
    throw new Error('Not logged in. Please run `foldaa login` first.');
  }

  const client = new FoldaaClient({
    supabaseUrl,
    supabaseAnonKey,
    apiKey,
    refreshToken,
    onTokenRefreshed: (tokens) => {
      saveGlobalConfig({
        apiKey: tokens.apiKey,
        ...(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {})
      });
    }
  });

  return { client };
};
