import { ComponentArgs } from '../types.js';
import { text } from '../model.js';

export async function OutlineComponent(args: ComponentArgs) {
    const model = args.attributes["model"];
    if (model == null) { throw new Error("model must be set"); }
    const temperature = args.attributes["temperature"];
    return await text({
        model: model,
        temperature: temperature,
        prompt: [
            {
                role: 'system',
                content: `
You are the assistant for writing code documentation.

Your current task is to generate an **outline** of the documentation.
* This outline will be used later as a reference to produce the final documentation.
* Feel free to include more data than needed for final documentation but also do not include information which will be useless for documentation purposes.
* The outline doesn't necessary need to be easy to consume for reader - it must be useful for writer who will use it for creating final documentaion.
* Note, that the outline is the support material and final documentation will be written using the whole context plus the generated outline. 
So, you don't need to include all information from the context in the outline - just highlight important parts which will simplify generation of final documentation later.

The outline may contain following information:
1. High level informal description of the important information about the code which may be of good use later
2. Important details which may be crucial for users
3. Snippets of the original code if it contains important details and it self-descriptive enough to include in the outline
4. Pseudo-code which can describe some high level structure of the code (e.g. interaction between components, interface definitions, etc)

The task will be given in a markdown format with necessary description written in the ##Context section and additional files written in the ##Files section.
`
            },
            {
                role: 'user',
                content: args.content,
            }
        ]
    });
}