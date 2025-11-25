import { ComponentArgs } from "../types.js";
import { wrap } from "../wrap.js";
import { extractGithubFile, extractGithubPr, extractMaybe, extractPatch } from "../extractor.js";

export async function GitHubPrComponent(args: ComponentArgs): Promise<string> {
    const pr = await extractGithubPr(args.attributes["pr"]);
    const patch = extractPatch(pr.diff);

    const elements = [];
    if (args.attributes["title"] !== false) {
        elements.push(`## ${pr.title}`);
    }
    if (args.attributes["description"] !== false) {
        elements.push(`${pr.description}`);
    }
    if (args.attributes["diff"] !== false) {
        const files = [];
        for (const file of patch) {
            files.push(`### ${file.path}\n${file.content}\n`)
        }
        elements.push(`## Changes\n${files.join("\n")}`);
    }
    if (args.attributes["files"]) {
        const files = [];
        for (const filename of args.attributes["files"]) {
            const file = await extractGithubFile(`${pr.owner}/${pr.repo}/${pr.sha}/${filename}`);
            files.push(`### ${filename}\n${extractMaybe(file, args.attributes["selector"], filename)}`)
        }
        elements.push(`## Selected files\n${files.join("\n")}`);
    }
    return wrap(elements.join('\n'), args.attributes);
}