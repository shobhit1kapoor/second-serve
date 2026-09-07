import type { ProviderConfig } from './inference';

export type ProviderEnvironment = {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_BASE_URL?: string;
};

/** Choose a server-owned endpoint together with its credential, never client input. */
export function providerConfig(env: ProviderEnvironment): ProviderConfig {
  if (env.GEMINI_API_KEY)
    return {
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      timeoutMs: 45000,
    };
  return {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    baseUrl: env.OPENAI_BASE_URL,
  };
}
