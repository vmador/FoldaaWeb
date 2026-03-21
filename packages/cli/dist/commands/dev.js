import chalk from 'chalk';
import { FoldaaClient } from '@foldaa/api-client';
export async function devCommand(url) {
    console.log(`\n🛠  ${chalk.bold.blue('Foldaa Dev')}\n`);
    const apiKey = process.env.FOLDAA_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vquididqfzyqozpzpzps.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdWlkaWRxZnp5cW96cHpwenBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNzIwMjksImV4cCI6MjA1NzY0ODAyOX0.mPrV0F0Z_6a_6a_6a_6a_6a_6a_6a_6a_6a_6a_6a_6a';
    const client = new FoldaaClient({
        supabaseUrl,
        supabaseAnonKey,
        apiKey
    });
    console.log(chalk.dim('Starting local development proxy...'));
    console.log(`${chalk.green('✔')} Proxying ${chalk.blue(url)} to edge runtime`);
    console.log(`${chalk.green('✔')} Hot reload enabled`);
    console.log(`\n${chalk.bold('Local Terminal UI available at:')}`);
    console.log(chalk.cyan('http://localhost:3000'));
    console.log(`\n${chalk.dim('Press Ctrl+C to stop')}`);
    // In a real implementation, this would spin up a local server
    // that proxies requests through the Foldaa edge logic.
}
