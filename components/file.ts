import * as fs from "fs";
import { ComponentArgs } from "../types.js";
import path from "path";
import { extractMaybe } from "../extractor.js";
import { wrap } from "../wrap.js";

export async function FileComponent(args: ComponentArgs): Promise<string> {
    const filePath = args.attributes["path"];
    const content = fs.readFileSync(path.join(args.cwd, filePath)).toString("utf-8");
    return wrap(extractMaybe(content, args.attributes["selector"], filePath), args.attributes);
}