import { ComponentArgs, ComponentOutput } from "../types.js";
import { wrap } from "../wrap.js";
import { extractGithubIssue } from "../extractor.js";

export async function GitHubIssueComponent(args: ComponentArgs): Promise<ComponentOutput> {
    const issue = await extractGithubIssue(args.attributes["issue"]);
    const info = `Title: ${issue.title}
Description: ${issue.description}
`;
    const content = wrap(info, args.attributes);
    return { content };
}