import chalk from 'chalk';
import * as p from '@clack/prompts';
import fs from 'fs';
import path from 'path';
export async function initCommand() {
    p.intro(chalk.bgCyan(chalk.black(' foldaa init ')));
    const cwd = process.cwd();
    const configPath = path.join(cwd, 'foldaa.json');
    if (fs.existsSync(configPath)) {
        p.log.warn('foldaa.json already exists in this directory.');
        const overwrite = await p.confirm({
            message: 'Do you want to overwrite it?',
            initialValue: false,
        });
        if (!overwrite) {
            p.outro(chalk.gray('Cancelled.'));
            return;
        }
    }
    // Auto-detect framework
    let defaultFramework = 'generic';
    let defaultOutputDir = 'dist';
    let defaultBuildCommand = 'npm run build';
    if (fs.existsSync(path.join(cwd, 'next.config.js')) || fs.existsSync(path.join(cwd, 'next.config.ts'))) {
        defaultFramework = 'nextjs';
        // Check if next Config implies standalone or export. We will default to standard export out/
        if (fs.existsSync(path.join(cwd, '.next/standalone'))) {
            defaultOutputDir = '.next/standalone';
        }
        else {
            defaultOutputDir = 'out';
        }
    }
    else if (fs.existsSync(path.join(cwd, 'vite.config.js')) || fs.existsSync(path.join(cwd, 'vite.config.ts'))) {
        defaultFramework = 'vite';
        defaultOutputDir = 'dist';
    }
    else if (fs.existsSync(path.join(cwd, 'astro.config.mjs')) || fs.existsSync(path.join(cwd, 'astro.config.ts'))) {
        defaultFramework = 'astro';
        defaultOutputDir = 'dist';
    }
    const projectDirName = path.basename(cwd);
    const group = await p.group({
        name: () => p.text({
            message: 'Project name',
            initialValue: projectDirName,
            validate: (value) => {
                if (!value)
                    return 'Please enter a name.';
                if (!/^[a-z0-9-]+$/.test(value))
                    return 'Name can only contain lowercase letters, numbers, and dashes.';
            },
        }),
        framework: () => p.select({
            message: 'Detected framework',
            initialValue: defaultFramework,
            options: [
                { value: 'nextjs', label: 'Next.js' },
                { value: 'vite', label: 'Vite / React / Vue' },
                { value: 'astro', label: 'Astro' },
                { value: 'generic', label: 'Other (Generic)' },
            ],
        }),
        outputDir: ({ results }) => p.text({
            message: 'Build output directory',
            initialValue: results.framework === 'nextjs' ? 'out' : 'dist',
        }),
        buildCommand: () => p.text({
            message: 'Build command',
            initialValue: defaultBuildCommand,
        }),
    }, {
        onCancel: () => {
            p.cancel('Operation cancelled.');
            process.exit(0);
        },
    });
    const config = {
        name: group.name,
        framework: group.framework,
        outputDir: group.outputDir,
        buildCommand: group.buildCommand,
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    p.outro(chalk.green(`✔ Created foldaa.json successfully! Run ${chalk.cyan('foldaa deploy-local')} to deploy.`));
}
