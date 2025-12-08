import { ComponentArgs, ComponentOutput } from "../types.js";

export async function InputComponent(args: ComponentArgs): Promise<ComponentOutput> {
    const ref = args.attributes["ref"];
    if (ref == null) {
        throw new Error(`ref attribute must be set`);
    }
    const input = await args.session.getInputById(ref);
    if (input == null) {
        throw new Error(`component by id ${ref} is not found`);
    }
    return { content: input };
}