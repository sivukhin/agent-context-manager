import { ComponentArgs } from '../types.js';
import { text } from '../model.js';

export async function CodeComponent(args: ComponentArgs) {
    const model = args.attributes["model"];
    if (model == null) { throw new Error("model must be set"); }
    const language = args.attributes["language"];
    if (language == null) { throw new Error("language must be set"); }

    const temperature = args.attributes["temperature"];
    return await text(args.db, {
        model: model,
        temperature: temperature,
        component: 'Code',
        prompt: [
            {
                role: 'system',
                content: `
You are the assistant for writing the code.

Your main task is produce clean and correct code written in language ${language}.

In the end you must produce only code as the result - without any additional "conversation".
The final result must be a valid code in the {{ context.language }} without any additional things (like backticks \`\`\`, conversation, etc).
If you need to clarify something - emit comments in the code.

The task will be given in a markdown format with necessary description written in the ##Context section and additional files written in the ##Files section
`
            },
            {
                role: 'user',
                content: args.content,
            }
        ]
    });
}