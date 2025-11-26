import * as fs from "fs";
import { ComponentArgs } from "../types.js";
import path from "path";
import { extractMaybe } from "../extractor.js";
import { wrap } from "../wrap.js";

export async function FileComponent(args: ComponentArgs): Promise<string> {
    const filePath = args.attributes["path"];
    const globPattern = args.attributes["glob"];
    if (filePath != null && globPattern != null) {
        throw new Error("both path and glob are set")
    }
    if (filePath == null && globPattern == null) {
        throw new Error("none of path and glob are set")
    }
    if (filePath != null) {
        const content = fs.readFileSync(path.join(args.cwd, filePath)).toString("utf-8");
        return wrap(extractMaybe(content, args.attributes["selector"], filePath), args.attributes);
    } else if (typeof globPattern == "string") {
        const paths = fs.globSync(globPattern, { cwd: args.cwd })
        const files = [];
        for (const filePath of paths) {
            const content = fs.readFileSync(path.join(args.cwd, filePath)).toString("utf-8");
            files.push(wrap(content, { path: filePath, ...args.attributes }));
        }
        return files.join('\n');
    } else if (Array.isArray(globPattern)) {
        const files = [];
        for (const globSingle of globPattern) {
            const paths = fs.globSync(globSingle, { cwd: args.cwd })
            for (const filePath of paths) {
                const content = fs.readFileSync(path.join(args.cwd, filePath)).toString("utf-8");
                files.push(wrap(content, { path: filePath, ...args.attributes }));
            }
        }
        return files.join('\n');
    } else {
        throw new Error("unexpected glob pattern");
    }
}