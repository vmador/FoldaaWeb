import ora from 'ora';
import chalk from 'chalk';
import { FoldaaCore } from '@foldaa/core';
import { FoldaaApiClient } from '@foldaa/api-client';
export async function inspectCommand(url) {
    console.log(`\n⚡ ${chalk.bold.blue('Foldaa')} ${chalk.dim('| Inspecting')}\n`);
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || '';
    const api = new FoldaaApiClient(supabaseUrl, anonKey);
    const core = new FoldaaCore(api);
    const spinner = ora('Analyzing website...').start();
    try {
        const result = await core.runInspection(url);
        spinner.succeed(chalk.green('Analysis complete'));
        console.log(`\n${chalk.bold.white('Site Report for:')} ${chalk.blue.underline(url)}`);
        console.log(`\n${chalk.bold('Brand Assets')}`);
        console.log(`  ${chalk.dim('Name:')}          ${result.name}`);
        console.log(`  ${chalk.dim('Icon:')}          ${result.icon}`);
        console.log(`  ${chalk.dim('Theme Color:')}   ${result.metadata.themeColor || 'Not detected'}`);
        console.log(`\n${chalk.bold('Infrastructure Details')}`);
        console.log(`  ${chalk.dim('Framework:')}     ${result.framework || 'Unknown'}`);
        console.log(`  ${chalk.dim('Analytics:')}     ${result.analytics?.join(', ') || 'None detected'}`);
        console.log(`  ${chalk.dim('Auth system:')}   ${result.auth || 'None detected'}`);
        console.log(`  ${chalk.dim('PWA Support:')}   ${result.pwa ? chalk.green('Yes') : chalk.yellow('No')}`);
        console.log(`\n${chalk.bold('SEO Metadata')}`);
        console.log(`  ${chalk.dim('Title:')}         ${result.metadata.title || 'N/A'}`);
        console.log(`  ${chalk.dim('Description:')}   ${result.metadata.description || 'N/A'}`);
        console.log('');
    }
    catch (error) {
        spinner.fail(chalk.red('Inspection failed'));
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
