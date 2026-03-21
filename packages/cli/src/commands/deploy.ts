import chalk from 'chalk';
import ora from 'ora';
import { FoldaaClient } from '@foldaa/api-client';

export async function deployCommand(client: FoldaaClient, projectId: string) {
  const spinner = ora(`Deploying project ${chalk.cyan(projectId)} to edge...`).start();
  
  try {
    // Step 1: Trigger re-deployment
    await client.redeployProject(projectId);
    
    // Step 2: Activate if necessary (optional depends on backend behavior)
    spinner.text = 'Activating deployment...';
    await client.activateProject(projectId);

    spinner.succeed(chalk.green(`Project ${projectId} deployed successfully!`));
    console.log(`\n${chalk.dim('Deployment log available at:')} ${chalk.cyan(`https://foldaa.com/p/${projectId}/logs`)}`);

  } catch (err: any) {
    spinner.fail(chalk.red('Deployment failed'));
    console.error(`\n${chalk.red(err.message)}`);
  }
}
