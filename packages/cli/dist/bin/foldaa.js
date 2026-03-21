#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { wrapCommand } from '../src/commands/wrap.js';
import { devCommand } from '../src/commands/dev.js';
import { loginCommand, listCommand, openCommand, domainCommand, analyticsCommand } from '../src/commands/others.js';
const program = new Command();
program
    .name('foldaa')
    .description(chalk.blue('⚡ Foldaa: URL to App in seconds.'))
    .version('1.0.0');
// Primary Command: foldaa wrap <url>
program
    .command('wrap')
    .description('Turn a website URL into an installable app')
    .argument('<url>', 'URL of the website to wrap')
    .option('-n, --name <name>', 'Custom name for the app')
    .option('-g, --guest', 'Run in guest mode (no API key required)')
    .action(wrapCommand);
// Dev Command: foldaa dev <url>
program
    .command('dev')
    .description('Start a local development proxy for a URL')
    .argument('<url>', 'URL to proxy')
    .action(devCommand);
// Authentication
program
    .command('login')
    .description('Authenticate with the Foldaa platform')
    .action(loginCommand);
// Project Utils
program
    .command('list')
    .description('List user projects')
    .action(listCommand);
program
    .command('open')
    .description('Open the project dashboard')
    .action(openCommand);
// Domain Management
const domain = program.command('domain').description('Manage custom domains');
domain
    .command('add')
    .description('Attach a custom domain to the project')
    .argument('<domain>', 'The domain name (e.g., app.mysite.com)')
    .action((name) => domainCommand('add', name));
domain
    .command('verify')
    .description('Verify DNS configuration')
    .action(() => domainCommand('verify'));
// Analytics
program
    .command('analytics')
    .description('Show traffic and install statistics')
    .action(analyticsCommand);
// Fallback to help if no command provided
if (!process.argv.slice(2).length) {
    program.help();
}
program.parse(process.argv);
