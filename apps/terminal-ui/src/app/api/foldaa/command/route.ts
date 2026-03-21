import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { parseArgsStringToArgv } from 'string-argv'

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

    const env = {
      ...process.env,
      FOLDAA_API_KEY: apiKey
    }

    // Determine path to CLI assuming the standard monorepo setup
    const projectRoot = process.cwd()
    const cliPath = path.resolve(projectRoot, '../../packages/cli/dist/index.js')
    
    console.log(`[API] Running command: ${command}`);
    console.log(`[API] CLI path: ${cliPath}`);

    // Use built CLI and proper argument parsing
    const args = parseArgsStringToArgv(command.replace(/^foldaa /, ''))
    const cliProcess = spawn('node', [cliPath, ...args], {
      env,
      shell: false
    })

    cliProcess.stdout.on('data', (data) => {
      // Stream raw output back without buffering (or let CLI emit JSON)
      writer.write(new TextEncoder().encode(data.toString()))
    })

    cliProcess.stderr.on('data', (data) => {
      // Send stringified error logs
      const msg = JSON.stringify({ event: 'progress', data: { step: data.toString().trim() } }) + '\n'
      writer.write(new TextEncoder().encode(msg))
    })

    cliProcess.on('error', (err) => {
      console.error(`[API] Spawn error: ${err.message}`);
      const msg = JSON.stringify({ event: 'error', data: `Failed to start CLI: ${err.message}` }) + '\n'
      writer.write(new TextEncoder().encode(msg))
      writer.close()
    })

    cliProcess.on('close', (code) => {
      if (code !== 0) {
        const msg = JSON.stringify({ event: 'error', data: `Process exited with code ${code}` }) + '\n'
        writer.write(new TextEncoder().encode(msg))
      } else {
        const msg = JSON.stringify({ event: 'done', result: { success: true } }) + '\n'
        writer.write(new TextEncoder().encode(msg))
      }
      writer.close()
    })

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
