import ora from 'ora';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { FoldaaCore } from '@foldaa/core';
import { FoldaaApiClient } from '@foldaa/api-client';
export async function createCommand(url, options) {
    console.log(`\n⚡ ${chalk.bold.blue('Foldaa')}\n`);
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || '';
    const api = new FoldaaApiClient(supabaseUrl, anonKey);
    const core = new FoldaaCore(api);
    const spinner = ora().start();
    try {
        const result = await core.runProjectCreation(url, {
            ...options,
            onProgress: (step, status) => {
                if (status === 'pending') {
                    spinner.text = step;
                }
                else if (status === 'success') {
                    spinner.succeed(chalk.green(step));
                    spinner.start();
                }
            }
        });
        spinner.stop();
        // Persist manifest for future 'add' and 'deploy' commands
        const manifest = {
            projectId: result.projectId,
            url: url,
            name: options.name || 'foldaa-app',
            deployedUrl: result.url,
            createdAt: new Date().toISOString()
        };
        fs.writeFileSync(path.join(process.cwd(), 'app.json'), JSON.stringify(manifest, null, 2));
        console.log(`\n${chalk.bold.green('✓ Deploy successful')}\n`);
        console.log(`${chalk.bold('App URL:')}`);
        console.log(chalk.blue.underline(result.url));
        console.log(`\n${chalk.bold('Scan on mobile:')}`);
        qrcode.generate(result.url, { small: true });
        console.log('');
    }
    catch (error) {
        spinner.fail(chalk.red('Deployment failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
