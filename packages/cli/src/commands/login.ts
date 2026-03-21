import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import open from 'open';
import http from 'http';
import { FoldaaClient } from '@foldaa/api-client';
import { getGlobalConfig, saveGlobalConfig, getBaseURL, getWebAppURL, isLocalDev } from '../utils/config.js';

const CALLBACK_PORT = 3333;

const getLoginUrl = () => {
  return `${getWebAppURL()}/cli-login`;
};

export const loginCommand = async (providedApiKey?: string) => {
  if (providedApiKey) {
    return verifyAndSave(providedApiKey);
  }

  console.log(chalk.bold('\nWelcome to Foldaa CLI! 🚀\n'));

  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'How would you like to log in?',
      choices: [
        { name: 'Browser-based (Recommended)', value: 'browser' },
        { name: 'Manual API Key', value: 'manual' }
      ]
    }
  ]);

  if (method === 'manual') {
    return handleManualLogin();
  }

  await handleBrowserLogin();
};

async function handleManualLogin() {
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Foldaa API Key:',
      mask: '*',
      validate: (input: string) => input.length > 0 || 'API Key is required.'
    }
  ]);

  return verifyAndSave(apiKey);
}

async function handleBrowserLogin() {
  const spinner = ora('Waiting for authentication in browser...').start();

  return new Promise<void>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      // Handle CORS preflight
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      console.log(chalk.dim(`\n[DEBUG] Incoming ${req.method} request: ${req.url}`));

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const token = data.token;
            const refreshToken = data.refreshToken;

            if (token) {
              console.log(chalk.green(`[DEBUG] Received tokens from browser:`));
              console.log(chalk.dim(`  Access Token: ${token.substring(0, 10)}...${token.substring(token.length - 10)} (len: ${token.length})`));
              if (refreshToken) {
                console.log(chalk.dim(`  Refresh Token: ${refreshToken.substring(0, 5)}... (len: ${refreshToken.length})`));
              } else {
                console.log(chalk.yellow(`  No Refresh Token received!`));
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));

              server.close();
              spinner.stop();

              await verifyAndSave(token, refreshToken);
              resolve();
            } else {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'No token found' }));
            }
          } catch (err) {
            console.error(chalk.red('[DEBUG] Failed to parse POST body'), err);
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      } else {
        // Fallback or legacy GET (though likely to fail with 431 if token is present)
        const url = new URL(req.url || '', `http://localhost:${CALLBACK_PORT}`);
        const token = url.searchParams.get('token');

        if (token) {
          console.log(chalk.green(`[DEBUG] Token captured via GET: ${token.substring(0, 10)}...`));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication Successful!</h1><p>You can close this window and return to the terminal.</p>');

          server.close();
          spinner.stop();

          try {
            await verifyAndSave(token);
            resolve();
          } catch (err) {
            reject(err);
          }
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      }
    });

    server.listen(CALLBACK_PORT, async () => {
      const fullLoginUrl = `${getLoginUrl()}?port=${CALLBACK_PORT}`;
      console.log(chalk.dim(`\nOpening browser to: ${fullLoginUrl}\n`));

      try {
        await open(fullLoginUrl);
      } catch (err) {
        spinner.fail(chalk.red('Failed to open browser.'));
        console.log(`Please visit this URL manually: ${chalk.cyan(fullLoginUrl)}`);
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      spinner.fail(chalk.red('Authentication timed out.'));
      reject(new Error('Timeout'));
    }, 300000);
  });
}

async function verifyAndSave(apiKey: string, refreshToken?: string) {
  const spinner = ora('Verifying authentication...').start();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vquididqfzyqozpzpzps.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdWlkaWRxZnp5cW96cHpwenBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNzIwMjksImV4cCI6MjA1NzY0ODAyOX0.mPrV0F0Z_6a_6a_6a_6a_6a_6a_6a_6a_6a_6a_6a_6a';

    const client = new FoldaaClient({
      supabaseUrl,
      supabaseAnonKey,
      apiKey
    });

    // In simulation/mock mode, this might just succeed.
    // We already have a mock for this in DirectApiClient if it's used.
    await client.login(apiKey);

    spinner.succeed(chalk.green('Authentication successful!'));

    saveGlobalConfig({ apiKey, refreshToken });

    console.log(chalk.dim('\nAPI Key saved to ~/.foldaa/config.json'));
    console.log(`\nYou are now logged in. Try running ${chalk.cyan('foldaa list')} to see your projects.`);
  } catch (error: any) {
    spinner.fail(chalk.red('Authentication failed.'));
    console.error(chalk.dim(error.message));
    throw error;
  }
}
