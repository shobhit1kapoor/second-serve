import {
  FunctionCallItem,
  ModelMessageItem,
  type InferenceInput,
  type InferenceOutput,
  type InferenceRunner,
  SemanticEvent,
} from '@mozaik-ai/core';
import { candidateAssignments, type DispatchState, type Role } from './domain';

export type ProviderConfig = {
  apiKey?: string;
  model: string;
  baseUrl?: string;
  timeoutMs?: number;
};
export type InferenceHooks = {
  begin: (role: Role) => string;
  end: (id: string, error?: string) => void;
  stopped: () => boolean;
};
type ContextEntry = {
  type: string;
  role?: string;
  content?: { text?: string };
  output?: { text?: string };
  name?: string;
  args?: string;
  callId?: string;
};
const answer = (text: string): InferenceOutput => ({
  items: [ModelMessageItem.rehydrate({ text })],
  tokenUsage: undefined,
  rowResponse: undefined,
});
const call = (name: string, args: unknown): InferenceOutput => ({
  items: [
    FunctionCallItem.rehydrate({
      callId: crypto.randomUUID(),
      name,
      args: JSON.stringify(args),
    }),
  ],
  tokenUsage: undefined,
  rowResponse: undefined,
});

/** Uses Mozaik's public runner contract, keeping credentials local to this run. */
export class DispatchInferenceRunner implements InferenceRunner {
  constructor(
    private state: DispatchState,
    private config: ProviderConfig,
    private hooks: InferenceHooks,
    private rehearsal = false,
  ) {}
  async run(input: InferenceInput): Promise<InferenceOutput> {
    const entries = input.context.getItems() as ContextEntry[];
    const instruction =
      entries.find((e) => e.role === 'developer')?.content?.text ?? '';
    const role = (instruction.match(/ROLE:(supply|community|dispatch)/)?.[1] ??
      'dispatch') as Role;
    if (this.hooks.stopped())
      return answer('The session has finished. No further changes were made.');
    const span = this.hooks.begin(role);
    try {
      const output = this.rehearsal
        ? await this.rehearse(role, entries)
        : await this.infer(input, entries);
      this.hooks.end(span);
      return output;
    } catch (error) {
      // Mozaik v4 runLoop is fire-and-forget. Resolve a final answer on provider failure
      // so the runtime closes the loop rather than creating an unhandled rejection.
      const message =
        error instanceof Error ? error.message : 'Model request failed';
      this.hooks.end(span, message);
      return answer(
        `I could not complete this turn: ${message}. Existing reservations remain unchanged.`,
      );
    }
  }
  async *stream(input: InferenceInput): AsyncGenerator<SemanticEvent> {
    yield SemanticEvent.create(
      'inference.output',
      'dispatch-runner',
      await this.run(input),
    );
  }
  private async infer(
    input: InferenceInput,
    entries: ContextEntry[],
  ): Promise<InferenceOutput> {
    if (!this.config.apiKey)
      throw new Error('A model provider key is required for live dispatch.');
    const messages = entries.map((e) => {
      if (e.type === 'function_call')
        return {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: e.callId,
              type: 'function',
              function: { name: e.name, arguments: e.args },
            },
          ],
        };
      if (e.type === 'function_call_output')
        return {
          role: 'tool',
          tool_call_id: e.callId,
          content: e.output?.text ?? '',
        };
      return {
        role: e.role === 'developer' ? 'system' : (e.role ?? 'user'),
        content: e.content?.text ?? '',
      };
    });
    const response = await fetch(
      `${this.config.baseUrl ?? 'https://api.openai.com/v1'}/chat/completions`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 25000),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_completion_tokens: 900,
          tools: input.tools?.map((t) => ({
            type: 'function',
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
              strict: t.strict,
            },
          })),
          parallel_tool_calls: false,
        }),
      },
    );
    if (!response.ok)
      throw new Error(
        `Provider returned HTTP ${response.status}. Check model access, credentials, and quota.`,
      );
    const result = (await response.json()) as {
      choices?: {
        message: {
          content?: string;
          tool_calls?: {
            id: string;
            function: { name: string; arguments: string };
          }[];
        };
      }[];
    };
    const message = result.choices?.[0]?.message;
    if (!message) throw new Error('Provider returned an empty response.');
    const firstTool = message.tool_calls?.[0];
    if (firstTool)
      return {
        items: [
          FunctionCallItem.rehydrate({
            callId: firstTool.id,
            name: firstTool.function.name,
            args: firstTool.function.arguments,
          }),
        ],
        tokenUsage: undefined,
        rowResponse: undefined,
      };
    return answer(message.content || 'Assessment complete.');
  }
  private async rehearse(
    role: Role,
    entries: ContextEntry[],
  ): Promise<InferenceOutput> {
    // Explicitly simulated inference latency. This is never reported as LLM evidence.
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        role === 'supply' ? 650 : role === 'community' ? 850 : 1050,
      ),
    );
    let lastUser = -1;
    entries.forEach((e, i) => {
      if (e.role === 'user') lastUser = i;
    });
    const recent = entries.slice(lastUser + 1);
    const findings = recent.some(
      (e) => e.type === 'function_call' && e.name === 'publish_finding',
    );
    if (role !== 'dispatch') {
      if (!findings)
        return call(
          'publish_finding',
          role === 'supply'
            ? {
                title: 'Prioritize the closing bakery',
                detail: `Sunday Bread closes in ${Math.max(0, 35 - this.state.minute)} scenario minutes. Chilled meals need a refrigerated vehicle. ${this.state.drivers.filter((d) => d.available).length} drivers are currently available.`,
                donationIds: ['d1', 'd3'],
              }
            : {
                title: 'Match capacity before committing',
                detail:
                  'Neighborhood Pantry accepts bakery and produce. Reserve chilled meal capacity at Community Kitchen or Westside Fridge; avoid routing every donation to one recipient.',
                donationIds: ['d2', 'd3'],
              },
        );
      return answer(
        role === 'supply'
          ? 'Pickup priorities are shared. I’m watching for new donations and changing windows.'
          : 'Recipient constraints are shared. I’m watching for capacity changes.',
      );
    }
    const candidate = candidateAssignments(this.state)[0];
    if (candidate)
      return call('reserve_pickup', {
        donationId: candidate.donationId,
        recipientId: candidate.recipientId,
        driverId: candidate.driverId,
        expectedRevision: this.state.revision,
        explanation:
          'Pickup fits the current window, vehicle capacity, refrigeration requirement, and recipient capacity. Closing windows are prioritized.',
      });
    return answer(
      'All currently feasible pickups are reserved. Any remaining donations need additional capacity or a different pickup window.',
    );
  }
}
