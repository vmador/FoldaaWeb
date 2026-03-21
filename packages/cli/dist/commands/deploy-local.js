import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { readFoldaaConfig } from '../utils/read-config.js';
// Setup AdmZip dynamic import since we will install it specifically for the CLI
let AdmZip;
try {
    AdmZip = require('adm-zip');
}
catch (e) {
    // It will be installed in package.json, so require should work. Defaulting back to import might fail in CJS vs MJS
}
export async function deployLocalCommand(client, options = {}) {
    if (!AdmZip) {
        try {
            // @ts-ignore
            const _module = await import('adm-zip');
            AdmZip = _module.default || _module;
        }
        catch (e) {
            console.error(chalk.red('❌ adm-zip is missing. Please run `npm install adm-zip` in the cli package.'));
            process.exit(1);
        }
    }
    const cwd = process.cwd();
    console.log(chalk.cyan('🚀 Starting local deployment...'));
    // 1. Read config
    let config = readFoldaaConfig(cwd);
    if (!config) {
        console.log(chalk.yellow('⚠️ No foldaa.json found. Using generic defaults. Run `foldaa init` to configure.'));
        const isNext = fs.existsSync(path.join(cwd, 'next.config.js')) || fs.existsSync(path.join(cwd, 'next.config.ts'));
        config = {
            name: path.basename(cwd).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            framework: isNext ? 'nextjs' : 'generic',
            outputDir: isNext ? 'out' : 'dist',
            buildCommand: 'npm run build'
        };
    }
    console.log(`\n${chalk.dim('Project:')}   ${chalk.white(config.name)}`);
    console.log(`${chalk.dim('Framework:')} ${chalk.white(config.framework)}`);
    console.log(`${chalk.dim('Output:   ')} ${chalk.white(config.outputDir)}\n`);
    const spinner = ora('Building application...').start();
    try {
        // 2. Build
        if (config.buildCommand) {
            spinner.text = `Running build: ${config.buildCommand}`;
            try {
                execSync(config.buildCommand, { stdio: 'inherit', cwd });
            }
            catch (buildError) {
                spinner.fail(chalk.red('Build failed.\n'));
                process.exit(1);
            }
        }
        const outputDirPath = path.join(cwd, config.outputDir || 'dist');
        if (!fs.existsSync(outputDirPath)) {
            spinner.fail(chalk.red(`Output directory not found: ${config.outputDir}`));
            process.exit(1);
        }
        // 3. Zip
        spinner.start('Zipping output directory...');
        const zip = new AdmZip();
        zip.addLocalFolder(outputDirPath);
        // Write out the zip buffer
        const zipBuffer = zip.toBuffer();
        const bundleSizeBytes = zipBuffer.length;
        spinner.succeed(`Build output zipped (${(bundleSizeBytes / 1024 / 1024).toFixed(2)} MB)`);
        if (options.dryRun) {
            console.log(chalk.yellow('\n--dry-run enabled. Skipping upload to Foldaa API.'));
            console.log(`${chalk.dim('Bundle size:')} ${(bundleSizeBytes / 1024 / 1024).toFixed(2)} MB`);
            process.exit(0);
        }
        // 4. Upload to Foldaa API
        spinner.start('Uploading bundle to Cloudflare Pages via Foldaa API...');
        // We need to bypass the standard API client for this specific multipart upload
        // since the client uses application/json
        const API_URL = process.env.FOLDAA_API_URL || 'http://localhost:3000/api/foldaa';
        // Construct FormData manually since Node environment fetch might block on File obj
        const formData = new FormData();
        const blob = new Blob([zipBuffer], { type: 'application/zip' });
        formData.append('file', blob, 'bundle.zip');
        formData.append('metadata', JSON.stringify({
            projectName: config.name,
            framework: config.framework
        }));
        // Read token from global state if client doesn't expose it directly
        const authHeaders = {};
        if (client.apiKey) {
            authHeaders['Authorization'] = `Bearer ${client.apiKey}`;
        }
        const uploadRes = await fetch(`${API_URL}/upload-bundle`, {
            method: 'POST',
            headers: authHeaders,
            body: formData
        });
        const result = await uploadRes.json();
        if (!uploadRes.ok || !result.success) {
            throw new Error(result.error || `Upload failed with status ${uploadRes.status}`);
        }
        spinner.succeed(chalk.green('Deployment successful!'));
        console.log(`\n🎉 Live URL: ${chalk.cyan(result.url)}`);
        console.log(`${chalk.dim('Preview URL:')} ${chalk.dim(result.previewUrl)}\n`);
    }
    catch (err) {
        spinner.fail(chalk.red('Deployment failed'));
        console.error(`\n${chalk.red(err.message)}`);
        process.exit(1);
    }
}
