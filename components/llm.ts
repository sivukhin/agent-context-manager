import { ComponentArgs, ComponentOutput } from '../types.js';
import { text } from '../model.js';

export async function LlmComponent(args: ComponentArgs): Promise<ComponentOutput> {
    const model = args.attributes["model"];
    if (model == null) { throw new Error("model must be set"); }
    const temperature = args.attributes["temperature"];
    const content = await text(args.session.db, {
        model: model,
        temperature: temperature,
        component: 'Llm',
        prompt: [
            {
                role: 'system',
                content: `
You are the helpful, constructive and precise LLM assistant.
Do exactly what will be asked in the markdown prompt.
`
            },
            {
                role: 'user',
                content: args.content.content,
            }
        ]
    });
    return { content };
}