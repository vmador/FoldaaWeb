#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getContext } from './context.js';
const program = new Command();
program
    .name('foldaa')
    .description('Foldaa V2 CLI - Legally-safe, production-ready PWA platform')
    .version('2.0.0');
// --- COMMANDS ---
program
    .command('login')
    .description('Login to Foldaa')
    .argument('[apiKey]', 'Your API Key (find it in Foldaa Dashboard)')
    .action(async (apiKey) => {
    const { loginCommand } = await import('./commands/login.js');
    await loginCommand(apiKey);
});
program
    .command('preview')
    .description('Create a temporary proxy and PWA for any URL')
    .argument('<url>', 'The URL to preview')
    .option('-n, --name <name>', 'Custom project name')
    .option('-t, --theme <color>', 'Theme color')
    .option('-b, --background <color>', 'Background color')
    .option('-s, --safe-area', 'Ignore safe area (full height)')
    .option('-p, --pwa', 'Enable PWA features')
    .action(async (url, options) => {
    const { wrapCommand } = await import('./commands/wrap.js');
    await wrapCommand(url, options);
});
program
    .command('claim')
    .description('Start domain ownership verification')
    .argument('<domain>', 'The domain to verify (e.g., myapp.com)')
    .action(async (domain) => {
    const spinner = ora(`Claiming domain ${domain}...`).start();
    try {
        const { client } = await getContext();
        const res = await client.claimDomain(domain);
        spinner.succeed(`Domain ${domain} claimed.`);
        console.log(`\n${chalk.yellow('Action Required:')} Add a TXT record to your DNS settings:`);
        console.log(`Host: ${chalk.bold('_foldaa-challenge.' + domain)}`);
        console.log(`Value: ${chalk.bold(res.token)}\n`);
        console.log(`After adding the record, run: ${chalk.cyan('foldaa verify ' + domain)}`);
    }
    catch (err) {
        spinner.fail(err.message);
    }
});
program
    .command('verify')
    .description('Finalize domain ownership verification')
    .argument('<domain>', 'The domain to verify')
    .action(async (domain) => {
    const spinner = ora(`Verifying domain ${domain}...`).start();
    try {
        const { client } = await getContext();
        await client.verifyDomain(domain);
        spinner.succeed(`Domain ${domain} verified successfully. You can now use it in Launch Mode.`);
    }
    catch (err) {
        spinner.fail(err.message);
    }
});
program
    .command('launch')
    .description('Deploy your app to your verified domain (Launch Mode)')
    .argument('<projectId>', 'The ID of your previewed project')
    .argument('<domain>', 'The verified domain')
    .action(async (projectId, domain) => {
    const spinner = ora(`Launching project ${projectId} on ${domain}...`).start();
    try {
        const { client } = await getContext();
        await client.launchProject({ projectId, domain });
        spinner.succeed(`App launched successfully at https://${domain}`);
    }
    catch (err) {
        spinner.fail(err.message);
    }
});
program
    .command('list')
    .description('List your projects')
    .action(async () => {
    const spinner = ora('Fetching your projects...').start();
    try {
        const { client } = await getContext();
        const projects = await client.getProjects();
        spinner.stop();
        console.log(`\n${chalk.bold('Your Foldaa Projects (V2)')}\n`);
        if (projects.length === 0) {
            console.log(chalk.dim('No projects found. Use "foldaa preview <url>" to start.'));
            return;
        }
        projects.forEach((p) => {
            const mode = p.status === 'active' ? chalk.green('ACTIVE') : chalk.blue(p.status.toUpperCase());
            console.log(`${chalk.bold(p.id.padEnd(10))} ${chalk.cyan(p.url)} [${mode}]`);
            console.log(`${chalk.dim('Type:')} ${p.type} ${chalk.dim('Source:')} ${p.source}`);
            console.log('');
        });
    }
    catch (err) {
        spinner.fail(err.message);
    }
});
// --- Magic Wrap (Defaults to PREVIEW) ---
const firstArg = process.argv[2];
if (firstArg && !firstArg.startsWith('-') && !['login', 'preview', 'claim', 'verify', 'launch', 'list', 'logout', 'help'].includes(firstArg)) {
    process.argv.splice(2, 0, 'preview');
}
program.parse();
