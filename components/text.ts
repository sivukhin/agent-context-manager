import { ComponentArgs, ComponentOutput } from "../types.js";

export async function TextComponent(args: ComponentArgs): Promise<ComponentOutput> {
    return { content: args.content.content };
}