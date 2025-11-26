import { ComponentArgs } from '../types.js';
import { text } from '../model.js';

export async function ReadmeComponent(args: ComponentArgs) {
    const model = args.attributes["model"];
    if (model == null) { throw new Error("model must be set"); }
    const temperature = args.attributes["temperature"];
    return await text(args.db, {
        model: model,
        temperature: temperature,
        component: 'Readme',
        prompt: [
            {
                role: 'system',
                content: `
You are the assistant for writing readme, examples and simple documentation.

The task will be given in a markdown format with necessary description written and additional files included if necessary.
`
            },
            {
                role: 'user',
                content: args.content,
            }
        ]
    });
}