import { ComponentArgs } from "../types.js";
import { wrap } from "../wrap.js";
import { extractGithubIssue } from "../extractor.js";

export async function GitHubIssueComponent(args: ComponentArgs): Promise<string> {
    const issue = await extractGithubIssue(args.attributes["issue"]);
    const content = `Title: ${issue.title}
Description: ${issue.description}
`;
    return wrap(content, args.attributes);
}