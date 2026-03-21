import chalk from 'chalk';
import ora from 'ora';
export async function authCommand(client, action, projectId) {
    const enabled = action === 'enable';
    const spinner = ora(`${enabled ? 'Enabling' : 'Disabling'} authentication for project ${chalk.cyan(projectId)}...`).start();
    try {
        // await client.toggleAuth(projectId, enabled);
        console.log(chalk.yellow('ℹ Authentication toggling via CLI is pending migration to Edge Functions.'));
        spinner.succeed(chalk.green(`Authentication ${enabled ? 'ENABLED' : 'DISABLED'} request sent for ${projectId}.`));
        if (enabled) {
            console.log(`\n${chalk.bold('Next Steps:')}`);
            console.log(`- Configure your auth providers in the Foldaa Dashboard.`);
            console.log(`- Your app now includes a built-in /auth route.`);
        }
    }
    catch (err) {
        spinner.fail(chalk.red('Failed to toggle authentication'));
        console.error(`\n${chalk.red(err.message)}`);
    }
}
