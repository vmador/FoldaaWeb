import fs from 'fs';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import { FoldaaCore } from '@foldaa/core';
import { FoldaaApiClient } from '@foldaa/api-client';
export async function deployCommand(options) {
    const appJsonPath = path.join(process.cwd(), 'app.json');
    if (!fs.existsSync(appJsonPath)) {
        console.error(chalk.red('❌ Error: app.json not found.'));
        process.exit(1);
    }
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const projectId = appJson.projectId;
    if (!projectId) {
        console.error(chalk.red('❌ Error: Project ID not found in app.json.'));
        process.exit(1);
    }
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || '';
    const api = new FoldaaApiClient(supabaseUrl, anonKey);
    const core = new FoldaaCore(api);
    console.log(`\n⚡ ${chalk.bold.blue('Foldaa')} ${chalk.dim('| Deploying updates')}\n`);
    const spinner = ora().start();
    try {
        const result = await core.runDeployment(projectId, (step, status) => {
            if (status === 'pending')
                spinner.text = step;
            if (status === 'success') {
                spinner.succeed(chalk.green(step));
                spinner.start();
            }
        });
        spinner.stop();
        console.log(`\n${chalk.bold.green('✓ Deployment successful')}`);
        console.log(`${chalk.bold('Environment:')} ${options.env}`);
        console.log(`${chalk.bold('Live URL:')}    ${chalk.blue.underline(result.url)}`);
        console.log(`\n${chalk.bold('Scan on mobile:')}`);
        qrcode.generate(result.url, { small: true });
        console.log('');
    }
    catch (error) {
        spinner.fail(chalk.red(`Deployment failed: ${error.message}`));
        process.exit(1);
    }
}
