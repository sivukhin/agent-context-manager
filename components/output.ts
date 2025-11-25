import * as fs from "fs";
import { ComponentArgs } from "../types.js";
import path from "path";

export async function OutputComponent(args: ComponentArgs): Promise<string> {
    const filePath = args.attributes["path"];
    fs.writeFileSync(path.join(args.cwd, filePath), args.content);
    return args.content;
}