#!/usr/bin/env bun

import { config } from 'dotenv'
import path from 'path';

config({ path: path.join(import.meta.dirname, '.env'), quiet: true })

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import { Node } from 'mdast';

import * as fs from "fs";

import { ComponentArgs, ComponentAttributes } from './types.js';
import { ShellComponent } from './components/shell.js';
import { FileComponent } from './components/file.js';
import { ReviewComponent } from './components/review.js';
import { ResearchComponent } from './components/research.js';
import { CodeComponent } from './components/code.js';
import { OutlineComponent } from './components/outline.js';
import { LinkComponent } from './components/link.js';
import { OutputComponent } from './components/output.js';
import { GitHubIssueComponent } from './components/gh_issue.js';
import { GitHubPrComponent } from './components/gh_pr.js';

import { program } from "commander";

type ContextTree =
    { type: 'text', content: string } |
    { type: 'context', id: string, name: string, attributes: ComponentAttributes, children: ContextTree[] };

const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkStringify)
    .use(remarkMdx);

type ContextState = {
    last: number;
}

function createContextTreeFromAst(ctx: ContextState, ast: Node): ContextTree[] {
    if (ast.type == 'mdxJsxFlowElement') {
        let attributes: { [K: string]: any } = {};
        for (const attribute of (ast as any).attributes) {
            if (attribute.type == 'mdxJsxAttribute') {
                if (typeof attribute.value == "string") {
                    attributes[attribute.name] = attribute.value;
                } else if (attribute.value != null) {
                    attributes[attribute.name] = eval(attribute.value.value);
                }
            } else {
                throw new Error(`unsupported JSX attribute: ${attribute}`);
            }
        }
        ctx.last += 1;
        return [{
            type: 'context',
            id: `${(ast as any).name}#${ctx.last}`,
            name: (ast as any).name,
            attributes: attributes,
            children: ((ast as any).children as any[]).flatMap(c => createContextTreeFromAst(ctx, c))
        }];
    } else {
        return [{
            type: 'text',
            content: processor.stringify(ast as any)
        }];
    }
}

function createContextTreeFromString(content: string): ContextTree[] {
    const ast = processor.parse(content);
    const ctx = { last: 0 };
    return ast.children.flatMap(c => createContextTreeFromAst(ctx, c));
}

interface AgentContextManagerOpts {
    cwd: string;
    registry: { [K: string]: (args: ComponentArgs) => Promise<string> }
}

async function execContext(opts: AgentContextManagerOpts, context: ContextTree[]): Promise<string> {
    const result = [];
    for (const element of context) {
        switch (element.type) {
            case 'text':
                result.push(element.content);
                break;
            case 'context':
                const content = await execContext(opts, element.children);
                if (!(element.name in opts.registry)) {
                    throw new Error(`unexpected component ${element.name}`);
                }
                const executor = opts.registry[element.name]!;
                result.push(await executor({
                    attributes: element.attributes,
                    content: content,
                    cwd: opts.cwd
                }));
                break;
        }
    }
    return result.join('\n');
}

async function execString(opts: AgentContextManagerOpts, content: string): Promise<string> {
    const context = createContextTreeFromString(content);
    return await execContext(opts, context);
}

const registry = {
    'Shell': ShellComponent,
    'File': FileComponent,
    'Review': ReviewComponent,
    'Research': ResearchComponent,
    'Code': CodeComponent,
    'Outline': OutlineComponent,
    'Link': LinkComponent,
    'Output': OutputComponent,
    'GitHubIssue': GitHubIssueComponent,
    'GitHubPr': GitHubPrComponent,
};

program.command('run <filepath>').action(async filepath => {
    const content = fs.readFileSync(path.join(process.cwd(), filepath)).toString("utf-8");
    console.info(await execString({ cwd: process.cwd(), registry }, content));
});

program.parse();