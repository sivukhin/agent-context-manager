import { extractMaybe } from "../extractor.js";
import { ComponentArgs } from "../types.js";
import { wrap } from "../wrap.js";

export async function LinkComponent(args: ComponentArgs): Promise<string> {
    const url = args.attributes["url"];
    const result = await fetch(url);
    return wrap(extractMaybe(await result.text(), args.attributes["selector"], url), args.attributes);
}