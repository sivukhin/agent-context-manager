import { extractMaybe } from "../extractor.js";
import { ComponentArgs, ComponentOutput } from "../types.js";
import { wrap } from "../wrap.js";

export async function LinkComponent(args: ComponentArgs): Promise<ComponentOutput> {
    const url = args.attributes["url"];
    const result = await fetch(url);
    const content = wrap(extractMaybe(await result.text(), args.attributes["selector"], url), args.attributes);
    return { content };
}