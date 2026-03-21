import chalk from 'chalk';
import ora from 'ora';
import { FoldaaClient } from '@foldaa/api-client';

export async function analyticsCommand(client: FoldaaClient, projectId: string) {
  const spinner = ora(`Fetching analytics for project ${chalk.cyan(projectId)}...`).start();
  
  try {
    const data = await client.getAnalytics(projectId);
    spinner.stop();
    
    console.log(`\n${chalk.bold('Analytics Summary for')} ${chalk.cyan(projectId)}:`);
    console.log(`${chalk.dim('─'.repeat(40))}`);
    console.log(`${chalk.bold('Visitors:')}  ${chalk.green(data.visitors.toLocaleString())}`);
    console.log(`${chalk.bold('Installs:')}  ${chalk.green(data.installs.toLocaleString())}`);
    console.log(`${chalk.bold('Updated:')}   ${chalk.dim(new Date(data.lastUpdated).toLocaleString())}`);
    console.log(`${chalk.dim('─'.repeat(40))}\n`);

  } catch (err: any) {
    spinner.fail(chalk.red('Failed to fetch analytics'));
    console.error(`\n${chalk.red(err.message)}`);
  }
}
