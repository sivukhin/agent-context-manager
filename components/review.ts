import { text } from '../model.js';
import { ComponentArgs, ComponentOutput } from '../types.js';

export async function ReviewComponent(args: ComponentArgs): Promise<ComponentOutput> {
    const model = args.attributes["model"];
    if (model == null) { throw new Error("model must be set"); }
    const temperature = args.attributes["temperature"];
    const content = await text(args.session.db, {
        model: model,
        temperature: temperature,
        component: 'Review',
        prompt: [
            {
                role: 'system',
                content: `
You are the code review assistant for performing high quality review of the software code.

Your current task is to analyze given patch and provide a list of **critical** issues in the code.

Be concise, clear and compact. Not to over-communicate, do not repeat same things again. 
Try to choose best way to communicate the issue:
1. Use examples if they will be clear and more compact
2. Use pseudo-code if it will communicate the issue more quicker

The critical issues may include following aspects:
* Correctness bugs like data races, invalid code logic
* Performance issues like very slow algorithmic complexity, unnecessary allocations
* Security issue which can lead to unwanted actions performed by user
* Incorrect usage of the API (filesystem, external API, etc)

Do not include minor issues in the review like:
* Minor refactoring suggestions
* Styling comments
* Request to document some part of the code
* Request to add more tests
* Legitimate assertions which was put intentionally by developer and serve its purpose
* The bugs which can happen **only if** there will be some other bug in other place

The review result must contain following information:
1. Generic review comment which can highlight some generic issues in the code or structural problems which must be fixed globally
2. List of review comments where every entry must contain:
  a. Path to the code with an issue
  b. Snippet containing first few lines (1-3 lines, more is better) in the target file which identify problematic region
  c. First line number in the target file which identify problematic region (this is just an alternative way to identify region) 
  d. Review comment

The task will be given in a markdown format with necessary description written in the ##Context section and additional files written in the ##Files section.
Note, that you will be given only partial context - so some definitions can be missed in your input. Do not complain about compilation issues in such cases.
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