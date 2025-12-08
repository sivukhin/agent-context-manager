import * as fs from "fs";
import { ComponentArgs, ComponentOutput } from "../types.js";
import path from "path";
import { extractMaybe } from "../extractor.js";
import { wrap } from "../wrap.js";

export async function FileComponent(args: ComponentArgs): Promise<ComponentOutput> {
    const filePath = args.attributes["path"];
    const globPattern = args.attributes["glob"];
    const emptyIfNotExists = args.attributes["emptyIfNotExists"];
    if (filePath != null && globPattern != null) {
        throw new Error("both path and glob are set")
    }
    if (filePath == null && globPattern == null) {
        throw new Error("none of path and glob are set")
    }
    let content: string;
    if (filePath != null) {
        try {
            const fileContent = fs.readFileSync(path.join(args.cwd, filePath)).toString("utf-8");
            content = wrap(extractMaybe(fileContent, args.attributes["selector"], filePath), args.attributes);
        } catch (error) {
            if ((error as any).code == 'ENOENT' && emptyIfNotExists) {
                return { content: '' }
            }
            throw error;
        }
    } else if (typeof globPattern == "string") {
        const paths = fs.globSync(globPattern, { cwd: args.cwd })
        const files = [];
        for (const filePath of paths) {
            const content = fs.readFileSync(path.join(args.cwd, filePath)).toString("utf-8");
            files.push(wrap(content, { path: filePath, ...args.attributes }));
        }
        content = files.join('\n');
    } else if (Array.isArray(globPattern)) {
        const files = [];
        for (const globSingle of globPattern) {
            const paths = fs.globSync(globSingle, { cwd: args.cwd })
            for (const filePath of paths) {
                const content = fs.readFileSync(path.join(args.cwd, filePath)).toString("utf-8");
                files.push(wrap(content, { path: filePath, ...args.attributes }));
            }
        }
        content = files.join('\n');
    } else {
        throw new Error("unexpected glob pattern");
    }
    return { content };
}