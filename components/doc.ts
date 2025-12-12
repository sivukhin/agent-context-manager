import { ComponentArgs, ComponentOutput } from '../types.js';
import { text } from '../model.js';

export async function DocComponent(args: ComponentArgs): Promise<ComponentOutput> {
    const model = args.attributes["model"];
    if (model == null) { throw new Error("model must be set"); }
    const temperature = args.attributes["temperature"];
    const content = await text(args.session.db, {
        model: model,
        temperature: temperature,
        component: 'Outline',
        prompt: [
            {
                role: 'system',
                content: `
You are the assistant for writing concise, informative and structured documentation.

The task will be given in a markdown format below.
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