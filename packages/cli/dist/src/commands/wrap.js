import ora from 'ora';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { FoldaaClient } from '@foldaa/api-client';
export async function wrapCommand(url, options) {
    console.log(`\n⚡ ${chalk.bold.blue('Foldaa Wrap')}\n`);
    const baseURL = process.env.FOLDAA_API_URL || 'https://api.foldaa.app';
    const apiKey = process.env.FOLDAA_API_KEY;
    if (!apiKey && !options.guest) {
        console.log(chalk.yellow('⚠ No API key found. Run `foldaa login` or use `--guest` mode.'));
    }
    const client = new FoldaaClient({ baseURL, apiKey });
    const spinner = ora('Analyzing website...').start();
    try {
        const result = await client.wrap(url, (step) => {
            spinner.succeed(chalk.green(step));
            spinner.start();
        });
        spinner.succeed(chalk.green('Project created successfully'));
        spinner.stop();
        // Persist configuration locally
        const config = {
            projectId: result.projectId,
            url: url,
            deployedUrl: result.previewUrl,
            createdAt: result.createdAt
        };
        fs.writeFileSync(path.join(process.cwd(), 'foldaa.json'), JSON.stringify(config, null, 2));
        console.log(`\n${chalk.bold.green('✓ Deployment Complete!')}\n`);
        console.log(`${chalk.bold('🚀 App ready:')}`);
        console.log(chalk.blue.underline(result.previewUrl));
        console.log(`\n${chalk.bold('Scan to view on mobile:')}`);
        qrcode.generate(result.previewUrl, { small: true });
        console.log('');
    }
    catch (error) {
        spinner.fail(chalk.red('Wrap failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
