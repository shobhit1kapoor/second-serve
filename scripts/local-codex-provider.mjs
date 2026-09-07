/** Optional local development provider. Never deploy or expose this bridge publicly.
 * Uses the documented codex exec command and the user's existing local sign-in.
 * No credentials are read, copied, or returned by this script.
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { randomUUID, timingSafeEqual } from 'node:crypto';

const port = Number(process.env.LOCAL_PROVIDER_PORT ?? 4318);
const token = process.env.LOCAL_PROVIDER_TOKEN;
if (!token || token.length < 24)
  throw new Error(
    'Set LOCAL_PROVIDER_TOKEN to a random local-only token of at least 24 characters.',
  );
const executable = process.env.CODEX_EXECUTABLE ?? 'codex';
const schema = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: ['tool', 'answer'] },
    name: { type: 'string' },
    argumentsJSON: { type: 'string' },
    text: { type: 'string' },
  },
  required: ['kind', 'name', 'argumentsJSON', 'text'],
  additionalProperties: false,
};
let active = 0;
function authorized(value) {
  const a = Buffer.from(value ?? '');
  const b = Buffer.from(`Bearer ${token}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function decide(payload) {
  const temporary = await mkdtemp(join(tmpdir(), 'second-serve-inference-'));
  const schemaPath = join(temporary, 'schema.json');
  const outputPath = join(temporary, 'answer.json');
  await writeFile(schemaPath, JSON.stringify(schema));
  const args = [
    'exec',
    '--ignore-user-config',
    '--ephemeral',
    '--skip-git-repo-check',
    '--sandbox',
    'read-only',
    '--cd',
    temporary,
    '--output-schema',
    schemaPath,
    '--output-last-message',
    outputPath,
    '-',
  ];
  const prompt = `You are an inference adapter for a local Mozaik application. Produce exactly the next assistant decision for the supplied conversation. Do not use native tools, inspect files, run shell commands, browse, or change anything. Supplied tool definitions are application tools: to request one, return kind=tool, its name and JSON-encoded arguments in argumentsJSON. Otherwise return kind=answer with text. The application will execute validated tools itself. Use empty strings for fields irrelevant to the selected kind. Do not output reasoning.\nCONVERSATION AND AVAILABLE APPLICATION TOOLS:\n${JSON.stringify(payload)}`;
  try {
    await new Promise((done, reject) => {
      const child = spawn(executable, args, {
        windowsHide: true,
        stdio: ['pipe', 'ignore', 'pipe'],
      });
      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr = (stderr + chunk.toString()).slice(-2000);
      });
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('Local inference timed out.'));
      }, 85000);
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) done();
        else
          reject(
            new Error(
              `Codex exited with ${code}. Check local login and model availability. ${stderr.includes('rate limit') ? 'A usage limit was reported.' : ''}`,
            ),
          );
      });
      child.stdin.end(prompt);
    });
    const result = JSON.parse(await readFile(outputPath, 'utf8'));
    if (result.kind === 'tool') {
      if (!payload.tools?.some((t) => t.function.name === result.name))
        throw new Error('Model requested an unavailable application tool.');
      JSON.parse(result.argumentsJSON);
      return {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: randomUUID(),
            type: 'function',
            function: { name: result.name, arguments: result.argumentsJSON },
          },
        ],
      };
    }
    if (result.kind !== 'answer' || typeof result.text !== 'string')
      throw new Error('Invalid structured model response.');
    return { role: 'assistant', content: result.text };
  } finally {
    // Only remove the exact directory created above, confined to the OS temp root.
    const target = resolve(temporary);
    if (
      target.startsWith(resolve(tmpdir()) + sep) &&
      target.split(sep).at(-1).startsWith('second-serve-inference-')
    )
      await rm(target, { recursive: true, force: true });
  }
}
http
  .createServer(async (request, response) => {
    const send = (status, data) => {
      response.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      response.end(JSON.stringify(data));
    };
    if (request.method !== 'POST' || request.url !== '/v1/chat/completions')
      return send(404, { error: 'Not found' });
    if (request.headers.origin || !authorized(request.headers.authorization))
      return send(403, { error: 'Local server-to-server requests only' });
    if (active >= 3)
      return send(429, { error: 'Three local inferences are already running' });
    active++;
    try {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 180000) throw new Error('Request too large');
      }
      const payload = JSON.parse(body);
      const started = Date.now();
      const message = await decide(payload);
      console.log(
        `Inference completed in ${Date.now() - started}ms (${message.tool_calls?.[0]?.function.name ?? 'answer'})`,
      );
      send(200, { id: randomUUID(), choices: [{ message }] });
    } catch (error) {
      console.error(error.message);
      send(502, {
        error: 'Local model inference failed. Check the bridge terminal.',
      });
    } finally {
      active--;
    }
  })
  .listen(port, '127.0.0.1', () =>
    console.log(
      `Local Codex inference bridge ready on 127.0.0.1:${port}. Keep this server private.`,
    ),
  );
