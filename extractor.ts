import path from "path";
import { parse, restore, select } from "./parser.js";
import parseDiff from "parse-diff";
import { Octokit } from "octokit";

export interface Extracted {
    path: string;
    content?: string;
    imageContent?: any;
}

export function extractMaybe(content: string, selector: string | null, contentPath: string): string {
    if (selector == null) {
        return content;
    }
    const ext = path.extname(contentPath);
    if (ext == ".rs") {
        return extract("rust", content, selector);
    } else if (ext == ".go") {
        return extract("go", content, selector);
    } else {
        throw new Error(`unsupported source code file: ${ext}`);
    }
}

export function extract(extension: "rust" | "go", content: string, selector: string): string {
    const sel = parseSelector(selector);
    let blocks;
    if (extension == "rust") {
        blocks = parse("rust", content);
    } else if (extension == "go") {
        blocks = parse("go", content);
    } else {
        throw new Error(`unsupported source code file: ${extension}`);
    }
    const selected = select(blocks, sel);
    if (selected.length == 0) {
        throw new Error(`unable to find block by selector: selector=${selector}`);
    }
    return restore(content!, selected);
}

export function extractPatch(diffs: parseDiff.File[]): Extracted[] {
    const extracted = [];
    for (const diff of diffs) {
        const content = [];
        for (const chunk of diff.chunks) {
            content.push(chunk.content);
            for (const changes of chunk.changes) {
                content.push(changes.content);
            }
        }
        extracted.push({ path: diff.to ?? "", content: content.join('\n') });
    }
    return extracted;
}

function parseSelector(selector: string): string[] {
    return selector.split(/::|(?=#)/);
}

export interface GithubPr {
    owner: string;
    repo: string;
    title: string;
    description: string;
    sha: string;
    diff: parseDiff.File[]
}

export interface GithubIssue {
    owner: string;
    repo: string;
    title: string;
    description: string;
}

// owner/repo/pr
export async function extractGithubPr(prPath: string): Promise<GithubPr> {
    const tokens = prPath.split("/");
    const octo = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const prNumber = parseInt(tokens[2], 10);
    const pull = await octo.rest.pulls.get({ owner: tokens[0], repo: tokens[1], pull_number: prNumber });
    const patch = await (await fetch(`https://api.github.com/repos/${tokens[0]}/${tokens[1]}/pulls/${prNumber}`, {
        headers: {
            "Authorization": "Bearer " + process.env.GITHUB_TOKEN,
            "Accept": "application/vnd.github.v3.patch"
        }
    })).text();
    const parsed = parseDiff(patch);
    return {
        owner: tokens[0],
        repo: tokens[1],
        title: pull.data.title,
        description: pull.data.body ?? "",
        sha: pull.data.head.sha,
        diff: parsed
    };
}

// owner/repo/issue
export async function extractGithubIssue(contextSelector: string): Promise<GithubIssue> {
    const tokens = contextSelector.split("/");
    const octo = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const pull = await octo.rest.issues.get({ owner: tokens[0], repo: tokens[1], issue_number: parseInt(tokens[2], 10) });
    return {
        owner: tokens[0],
        repo: tokens[1],
        title: pull.data.title,
        description: pull.data.body ?? "",
    };
}

// owner/repo/sha/<path>
export async function extractGithubFile(contextSelector: string): Promise<string> {
    const tokens = contextSelector.split("/");
    const octo = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { data } = await octo.rest.repos.getContent({ owner: tokens[0], repo: tokens[1], ref: tokens[2], path: tokens.slice(3).join('/') });
    if (!("content" in data)) {
        throw new Error(`Not a file: ${path}`);
    }
    return Buffer.from(data.content, "base64").toString("utf-8");
}