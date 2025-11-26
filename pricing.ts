import { LanguageModelUsage } from "ai";

const pricePerToken = 1_000_000;

const pricings: { [K: string]: { [K: string]: { input: number, inputCached: number | null, output: number } } } = {
    'anthropic': {
        'claude-sonnet-4-20250514': { input: 3, inputCached: 0, output: 15 }
    },
    'openai': {
        'gpt-5': { input: 1.25, inputCached: 0.125, output: 10.00 },
        'gpt-5-mini': { input: 0.25, inputCached: 0.025, output: 2.00 },
        'gpt-5-nano': { input: 0.05, inputCached: 0.005, output: 0.40 },
        'gpt-5-chat-latest': { input: 1.25, inputCached: 0.125, output: 10.00 },
        'gpt-5-codex': { input: 1.25, inputCached: 0.125, output: 10.00 },
        'gpt-4.1': { input: 2.00, inputCached: 0.50, output: 8.00 },
        'gpt-4.1-mini': { input: 0.40, inputCached: 0.10, output: 1.60 },
        'gpt-4.1-nano': { input: 0.10, inputCached: 0.025, output: 0.40 },
        'gpt-4o': { input: 2.50, inputCached: 1.25, output: 10.00 },
        'gpt-4o-2024-05-13': { input: 5.00, inputCached: null, output: 15.00 },
        'gpt-4o-mini': { input: 0.15, inputCached: 0.075, output: 0.60 },
        'gpt-realtime': { input: 4.00, inputCached: 0.40, output: 16.00 },
        'gpt-4o-realtime-preview': { input: 5.00, inputCached: 2.50, output: 20.00 },
        'gpt-4o-mini-realtime-preview': { input: 0.60, inputCached: 0.30, output: 2.40 },
        'gpt-audio': { input: 2.50, inputCached: null, output: 10.00 },
        'gpt-4o-audio-preview': { input: 2.50, inputCached: null, output: 10.00 },
        'gpt-4o-mini-audio-preview': { input: 0.15, inputCached: null, output: 0.60 },
        'o1': { input: 15.00, inputCached: 7.50, output: 60.00 },
        'o1-pro': { input: 150.00, inputCached: null, output: 600.00 },
        'o3-pro': { input: 20.00, inputCached: null, output: 80.00 },
        'o3': { input: 2.00, inputCached: 0.50, output: 8.00 },
        'o3-deep-research': { input: 10.00, inputCached: 2.50, output: 40.00 },
        'o4-mini': { input: 1.10, inputCached: 0.275, output: 4.40 },
        'o4-mini-deep-research': { input: 2.00, inputCached: 0.50, output: 8.00 },
        'o3-mini': { input: 1.10, inputCached: 0.55, output: 4.40 },
        'o1-mini': { input: 1.10, inputCached: 0.55, output: 4.40 },
        'codex-mini-latest': { input: 1.50, inputCached: 0.375, output: 6.00 },
        'gpt-4o-mini-search-preview': { input: 0.15, inputCached: null, output: 0.60 },
        'gpt-4o-search-preview': { input: 2.50, inputCached: null, output: 10.00 },
        'computer-use-preview': { input: 3.00, inputCached: null, output: 12.00 }
    }
};

export function price(model: string, usage: LanguageModelUsage): number {
    const tokens = model.split('/', 2);
    const pricing = pricings[tokens[0]!]![tokens[1]!]!;
    return (
        pricing.input * (usage!.inputTokens! - (usage!.cachedInputTokens ?? 0)) +
        (pricing.inputCached ?? 0) * (usage!.cachedInputTokens ?? 0) +
        pricing.output * usage!.outputTokens!
    ) / pricePerToken;
}