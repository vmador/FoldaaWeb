import chalk from 'chalk';
import ora from 'ora';
import { getContext } from '../context.js';

export async function wrapCommand(url: string, options: any = {}) {
  const spinner = ora(`Analyzing ${chalk.cyan(url)}...`).start();
  
  try {
    const { client } = await getContext();
    
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

    // 1. Inspect Website (runs on Edge)
    spinner.text = 'Inspecting website metadata...';
    const inspection = await client.inspectWebsite(formattedUrl);
    spinner.succeed(chalk.green('Website inspected.'));

    // 2. Create Draft Project (Preview Mode)
    const hostname = new URL(formattedUrl).hostname.replace(/^www\./, '').split('.')[0];
    
    // Prioritize user-provided name, then extracted title, then hostname
    const projectName = options.name || (inspection.title && inspection.title !== hostname 
      ? `${hostname} - ${inspection.title}`
      : (inspection.title || hostname));

    spinner.start(`Creating preview for "${projectName}"...`);
    const { projectId } = await client.createDraftProject({
      name: projectName,
      type: 'url',
      source: url
    });
    spinner.succeed(chalk.green(`Preview project created: ${projectId}`));

    // 3. Deploy Project (Preview flow)
    spinner.start('Deploying limited preview...');
    const result = await client.deployProject({
      projectId,
      url: formattedUrl,
      name: projectName,
      pwaAssets: inspection.assets, 
      options: {
        pwa: {
          description: inspection.description,
          theme_color: options.theme || inspection.themeColor || '#000000',
          background_color: options.background || '#ffffff',
          ignore_safe_area: options.safeArea || false,
          viewport_mode: options.safeArea ? 'cover' : 'dvh'
        }
      }
    });

    spinner.succeed(chalk.green('Preview live!'));
    
    console.log(`\n${chalk.bold('🚀 Foldaa Preview (Restricted Mode)')}`);
    console.log(`- ${chalk.bold('ID:')}      ${result.projectId}`);
    console.log(`- ${chalk.bold('URL:')}     ${chalk.cyan(result.url)}`);
    
    console.log(`\n${chalk.dim('ℹ PREVIEW restrictions: No Auth, No Push, No Custom Domain.')}`);
    console.log(`${chalk.yellow('! Run "foldaa claim <domain>" to unlock full features.')}`);

  } catch (err: any) {
    spinner.fail(chalk.red('Preview failed'));
    console.error(`\n${chalk.red(err.message)}`);
    process.exit(1);
  }
}
