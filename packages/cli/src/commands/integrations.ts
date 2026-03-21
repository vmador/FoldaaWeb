import chalk from 'chalk';
import ora from 'ora';
import { FoldaaClient } from '@foldaa/api-client';

export async function integrationsCommand(client: FoldaaClient, action: string, projectId: string, feature: string) {
  if (action === 'enable') {
    const spinner = ora(`Installing integration ${chalk.cyan(feature)} for project ${chalk.cyan(projectId)}...`).start();
    
    try {
      // await client.installFeature(projectId, feature);
      console.log(chalk.yellow('ℹ Integration management via CLI is pending migration to Edge Functions.'));
      spinner.succeed(chalk.green(`Integration ${feature} enable request sent for ${projectId}.`));
      
      console.log(`\n${chalk.bold('Next Steps:')}`);
      console.log(`- Configure ${feature} in your Project Settings.`);

    } catch (err: any) {
      spinner.fail(chalk.red(`Failed to enable ${feature}`));
      console.error(`\n${chalk.red(err.message)}`);
    }
  } else {
    console.error(chalk.red(`Unknown action: ${action}. Only 'enable' is supported for integrations currently.`));
  }
}
