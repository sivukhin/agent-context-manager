import { generateText, ModelMessage } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { Db } from "./db.js";
import { fetch, Agent } from 'undici'

import { encoding_for_model, TiktokenModel } from "@dqbd/tiktoken"
import { countTokens } from "@anthropic-ai/tokenizer"

export interface TextOpts {
    model: string;
    component: string;
    temperature?: number;
    prompt: ModelMessage[];
}

const TimeoutMs = 10 * 60 * 1000;

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    fetch: (url, options) => {
        return fetch(url, {
            ...options,
            // @ts-ignore
            idleTimeout: TimeoutMs,
            // @ts-ignore
            dispatcher: new Agent({
                headersTimeout: TimeoutMs,
                bodyTimeout: TimeoutMs,
                connectTimeout: TimeoutMs,
                keepAliveTimeout: TimeoutMs,
            }),
        })
    },
});

const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    fetch: (url, options) => {
        return fetch(url, {
            ...options,
            // @ts-ignore
            idleTimeout: TimeoutMs,
            // @ts-ignore
            dispatcher: new Agent({
                headersTimeout: TimeoutMs,
                bodyTimeout: TimeoutMs,
                connectTimeout: TimeoutMs,
                keepAliveTimeout: TimeoutMs,
            }),
        })
    },
});

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    fetch: (url, options) => {
        return fetch(url, {
            ...options,
            // @ts-ignore
            idleTimeout: TimeoutMs,
            // @ts-ignore
            dispatcher: new Agent({
                headersTimeout: TimeoutMs,
                bodyTimeout: TimeoutMs,
                connectTimeout: TimeoutMs,
                keepAliveTimeout: TimeoutMs,
            }),
        })
    },
});

export function tokens(model: string, text: string): number {
    const tokens = model.split('/');
    switch (tokens[0]) {
        case "openai":
            const encoding = encoding_for_model(tokens[1] as TiktokenModel);
            return encoding.encode_ordinary(text).length
        case "anthropic":
            return countTokens(text);
        case "google":
            throw new Error("tokens estimation is not supported for google models");
    }
    throw new Error(`unexpected model provider: ${tokens[0]}`);
}

export async function text(db: Db, opts: TextOpts): Promise<string> {
    const tokens = opts.model.split('/');
    let model: any;
    switch (tokens[0]) {
        case "openai":
            model = openai(tokens[1])
            break;
        case "anthropic":
            model = anthropic(tokens[1])
            break;
        case "google":
            model = google(tokens[1])
            break;
    }
    const startUnixTs = Date.now();
    const start = performance.now();

    const result = await generateText({
        model: model,
        temperature: opts.temperature,
        prompt: opts.prompt,
        abortSignal: AbortSignal.timeout(TimeoutMs)
    });
    const duration = performance.now() - start;
    const response = result.content.filter(c => c.type == 'text').map(c => c.text).join('\n');
    await db.recordLlm({
        component: opts.component,
        duration: duration,
        start: startUnixTs,
        model: opts.model,
        request: JSON.stringify(opts.prompt),
        response: response,
        usage: result.totalUsage,
    })
    return response;
}
