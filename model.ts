import { generateText, ModelMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"

export interface TextOpts {
    model: string;
    temperature?: number;
    prompt: ModelMessage[];
}

export async function text(opts: TextOpts): Promise<string> {
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
    const result = await generateText({
        model: model,
        temperature: opts.temperature,
        prompt: opts.prompt
    });
    return result.content.filter(c => c.type == 'text').map(c => c.text).join('\n');
}
