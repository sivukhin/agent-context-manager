import { ComponentArgs, ComponentOutput } from '../types.js';
import { text } from '../model.js';

export async function ResearchComponent(args: ComponentArgs): Promise<ComponentOutput> {
    const model = args.attributes["model"];
    if (model == null) { throw new Error("model must be set"); }
    const temperature = args.attributes["temperature"];
    const content = await text(args.session.db, {
        model: model,
        temperature: temperature,
        component: 'Research',
        prompt: [
            {
                role: 'system',
                content: `
You are the assistant for researching complex system engineering and development questions.
Your specialization is databases, low-level systems and performance.

Your current task is to assist in research of the complex engineering topic.
Your main goal is to support discussion in order to make best final decisions and drive research into the right direction. 

You may do the following:
* Ask questions if something is unclear or some context is missing
* Suggest options for research directions and implementation plans
* Discuss ambigous moments which can impact the final research results
* Highlight missing parts in logical implications
* Suggest to remove some information from the scope as irrelevant

Be constructive, concise, structured and avoid unnecessary dialogue if possible (e.g. do not write "awesome idea", "you are absolutely right", etc).

The task will be given in a markdown format with necessary description written in the ##Context section and additional files written in the ##Files section.
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