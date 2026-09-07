import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DeveloperMessageItem,
  FunctionCallItem,
  FunctionCallOutputItem,
  ModelContext,
  type InferenceInput,
} from '@mozaik-ai/core';
import { DispatchInferenceRunner } from '../lib/inference';
import { createScenario } from '../lib/domain';

afterEach(() => vi.unstubAllGlobals());
const input = (): InferenceInput => ({
  model: 'gemini-3.5-flash-lite',
  context: ModelContext.create().addContextItem(
    DeveloperMessageItem.create('ROLE:dispatch'),
  ),
  tools: [
    {
      type: 'function',
      name: 'read_board',
      description: 'Read the current board',
      parameters: { type: 'object', properties: {} },
      strict: true,
      invoke: async () => ({}),
    },
  ],
});
const setup = () => {
  const end = vi.fn();
  return {
    end,
    runner: new DispatchInferenceRunner(
      createScenario(),
      {
        model: 'gemini-3.5-flash-lite',
        apiKey: 'test-key',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      },
      { begin: () => 'request', end, stopped: () => false },
    ),
  };
};

describe('provider transport', () => {
  it('round-trips Gemini tool signatures privately through actual Mozaik context items', async () => {
    const metadata = {
      google: { thought_signature: 'opaque-provider-test-signature' },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: 'provider-call',
                    type: 'function',
                    function: { name: 'read_board', arguments: '{}' },
                    extra_content: metadata,
                  },
                ],
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          choices: [{ message: { content: 'Board reviewed.' } }],
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { runner } = setup();
    const first = input();
    const output = await runner.run(first);
    expect(output.items[0]).toBeInstanceOf(FunctionCallItem);
    expect(JSON.stringify(output)).not.toContain(
      'opaque-provider-test-signature',
    );
    first.context
      .addContextItems(output.items)
      .addContextItem(
        FunctionCallOutputItem.create('provider-call', '{"revision":1}'),
      );
    await runner.run(first);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    );
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.messages[1].tool_calls[0].extra_content).toEqual(metadata);
    expect(body.messages[2]).toEqual({
      role: 'tool',
      tool_call_id: 'provider-call',
      content: '{"revision":1}',
    });
    expect(body.reasoning_effort).toBe('low');
  });

  it('records quota failure without echoing provider bodies or credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('sensitive provider body', { status: 429 }),
        ),
    );
    const { runner, end } = setup();
    const output = await runner.run(input());
    expect(end.mock.calls[0][1]).toContain('quota limit');
    expect(JSON.stringify(output)).not.toContain('sensitive provider body');
    expect(JSON.stringify(output)).not.toContain('test-key');
  });

  it.each([
    {},
    {
      tool_calls: [
        { id: 'x', function: { name: 'read_board', arguments: '{' } },
      ],
    },
    {
      tool_calls: [
        { id: 'x', function: { name: 'delete_everything', arguments: '{}' } },
      ],
    },
    {
      tool_calls: Array.from({ length: 2 }, (_, i) => ({
        id: String(i),
        function: { name: 'read_board', arguments: '{}' },
      })),
    },
  ])('rejects incomplete or unsupported provider actions', async (message) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ choices: [{ message }] })),
    );
    const { runner, end } = setup();
    const output = await runner.run(input());
    expect(end.mock.calls[0][1]).toBeTruthy();
    expect(output.items.some((item) => item instanceof FunctionCallItem)).toBe(
      false,
    );
  });
});
