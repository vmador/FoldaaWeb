// foldaa/packages/worker-template/src/index.ts
// Cloudflare Worker Template for Foldaa Apps

import { withProxy } from './nodes/proxy';
import { compose } from './utils';

// ====== INYECCIÓN DINÁMICA DE MIDDLEWARES AQUI ======
const middlewares = [
  withProxy // Siempre al final de la cadena
];
// ====================================================

const appPipeline = compose(middlewares);

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    try {
      // Env contiene bindings a KV, variables de entorno como ORIGIN_URL
      return await appPipeline(request, env, ctx);
    } catch (error: any) {
      return new Response(\`Foldaa Internal Error: \${error.message}\`, { status: 500 });
    }
  }
};
