import fs from 'fs';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { FoldaaCore } from '@foldaa/core';
import { FoldaaApiClient } from '@foldaa/api-client';
export async function addCommand(feature) {
    const appJsonPath = path.join(process.cwd(), 'app.json');
    if (!fs.existsSync(appJsonPath)) {
        console.error(chalk.red('❌ Error: app.json not found. Are you in a Foldaa project?'));
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
    console.log(`\n⚡ ${chalk.bold.blue('Foldaa')} ${chalk.dim('| Adding Extension')}\n`);
    const spinner = ora().start();
    try {
        await core.runFeatureInstall(projectId, feature, (step, status) => {
            if (status === 'pending')
                spinner.text = step;
            if (status === 'success')
                spinner.succeed(chalk.green(step));
        });
        // Update local manifest
        appJson.extensions = appJson.extensions || {};
        appJson.extensions[feature] = { enabled: true, addedAt: new Date().toISOString() };
        fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
        console.log(`\n${chalk.bold.green('✓ Feature added successfully')}\n`);
    }
    catch (error) {
        spinner.fail(chalk.red(`Failed to add feature: ${error.message}`));
        process.exit(1);
    }
}
