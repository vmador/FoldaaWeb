import { NextResponse } from 'next/server'
import { parseArgsStringToArgv } from 'string-argv'
import { program } from '@foldaa/cli'

export async function POST(req: Request) {
  try {
    const { command } = await req.json()
    const authHeader = req.headers.get('authorization')
    let apiKey = ''
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7)
    }

    if (!command) {
      return new NextResponse("Command required", { status: 400 })
    }

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // Pass API key to environment for the CLI client
    process.env.FOLDAA_API_KEY = apiKey

    console.log(`[API] Running in-process command: ${command}`);

    // Capture stdout/stderr and stream to the response
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);
    const originalConsoleLog = console.log.bind(console);
    const originalConsoleError = console.error.bind(console);

    const streamWrite = (data: any) => {
      const msg = data.toString();
      writer.write(new TextEncoder().encode(msg));
      return true;
    };

    // Temporarily override for this request
    // Note: In serverless, this is generally safe per instance, but we must restore it.
    process.stdout.write = streamWrite as any;
    process.stderr.write = streamWrite as any;
    console.log = (...args) => streamWrite(args.join(' ') + '\n');
    console.error = (...args) => streamWrite(args.join(' ') + '\n');

    const runCommand = async () => {
      try {
        const args = parseArgsStringToArgv(command.replace(/^foldaa /, ''))
        
        // Setup commander for this specific run
        program.exitOverride(); // Prevent process.exit()
        program.configureOutput({
          writeOut: (str) => streamWrite(str),
          writeErr: (str) => streamWrite(str)
        });

        // We need to simulate process.argv for commander
        // args[0] is usually 'node', args[1] is the script path
        await program.parseAsync(['node', 'foldaa', ...args]);
        
        const msg = JSON.stringify({ event: 'done', result: { success: true } }) + '\n'
        writer.write(new TextEncoder().encode(msg))
      } catch (err: any) {
        if (err.code !== 'commander.helpDisplayed' && err.code !== 'commander.version') {
          console.error(`[API] Execution error: ${err.message}`);
          const msg = JSON.stringify({ event: 'error', data: err.message }) + '\n'
          writer.write(new TextEncoder().encode(msg))
        }
      } finally {
        // Restore originals
        process.stdout.write = originalStdoutWrite;
        process.stderr.write = originalStderrWrite;
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        writer.close()
      }
    };

    // Run in background but return the stream
    runCommand();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 })
  }
}
