import Parser from "tree-sitter";
import Rust from "tree-sitter-rust";
import Go from "tree-sitter-go";
import Markdown from "@tree-sitter-grammars/tree-sitter-markdown";

export interface Position {
    byteOffset: number;
    lineNumber: number;
    lineOffset: number;
}

export interface Block {
    name?: string | undefined;
    start: Position;
    end: Position;
    children: Block[];
    references: string[];
    commentBlock?: Block | null,
    definitionBlock?: Block | null,
    comment?: string | null
}

function references(node: Parser.SyntaxNode): string[] {
    const extracted: string[] = [];

    const visit = (n: Parser.SyntaxNode) => {
        if (n.type === "call_expression") {
            const funcNode = n.childForFieldName("function");
            if (funcNode) {
                const tokens = funcNode.text.split('.');
                extracted.push(tokens[tokens.length - 1]!);
            }
        }

        for (const c of n.namedChildren) visit(c);
    };

    visit(node);
    return extracted;
}

function blocks(node: Parser.SyntaxNode): Block[] {
    const extracted: Block[] = [];

    for (let i = 0; i < node.namedChildren.length; i++) {
        const child = node.namedChildren[i];
        let comments = [];
        let c = i - 1;
        while (c >= 0 && (node.namedChildren[c].type == "line_comment" || node.namedChildren[c].type == "comment")) {
            comments.push(node.namedChildren[c]);
            c -= 1;
        }
        comments.reverse();
        let comment = comments.length == 0 ? null : comments.map(c => c.text.trimEnd() + "\n").join("");
        let commentBlock: Block | null = comments.length == 0 ? null : {
            start: {
                byteOffset: comments[0].startIndex,
                lineNumber: comments[0].startPosition.row,
                lineOffset: comments[0].startPosition.column,
            },
            end: {
                byteOffset: comments[comments.length - 1].endIndex,
                lineNumber: comments[comments.length - 1].endPosition.row,
                lineOffset: comments[comments.length - 1].endPosition.column,
            },
            children: [],
            references: []
        };
        switch (child.type) {
            case "trait_item":
            case "mod_item":
            case "impl_item":
            case "struct_item":
            case "section":
            case "class_declaration": {
                let name = child.childForFieldName("name")?.text;
                const body = child.childForFieldName("body");
                for (const c of child.namedChildren) {
                    if (c.type == "generic_type") {
                        name = /^[^<>]+/g.exec(c.text)![0];
                    }
                    if (c.type == "type_identifier") {
                        name = c.text;
                    }
                    if (c.type == 'atx_heading') {
                        name = c.text.trim().replace(/#+ +/g, '');
                    }
                }
                extracted.push({
                    name,
                    start: {
                        byteOffset: child.startIndex,
                        lineNumber: child.startPosition.row,
                        lineOffset: child.startPosition.column,
                    },
                    end: {
                        byteOffset: child.endIndex,
                        lineNumber: child.endPosition.row,
                        lineOffset: child.endPosition.column,
                    },
                    children: body ? blocks(body) : blocks(child),
                    references: [],
                    comment: comment,
                    commentBlock: commentBlock,
                    definitionBlock: {
                        name: name,
                        start: {
                            byteOffset: child.startIndex,
                            lineNumber: child.startPosition.row,
                            lineOffset: child.startPosition.column,
                        },
                        end: {
                            byteOffset: (body ?? child).startIndex,
                            lineNumber: (body ?? child).startPosition.row,
                            lineOffset: (body ?? child).startPosition.column,
                        },
                        references: [],
                        children: [],
                    }
                });
                break;
            }

            case "function_item":
            case "function_declaration":
            case "method_definition":
            case "enum_item":
                const name = child.childForFieldName("name");
                const body = child.descendantsOfType("block")[0];
                extracted.push({
                    name: name?.text,
                    start: {
                        byteOffset: child.startIndex,
                        lineNumber: child.startPosition.row,
                        lineOffset: child.startPosition.column,
                    },
                    end: {
                        byteOffset: child.endIndex,
                        lineNumber: child.endPosition.row,
                        lineOffset: child.endPosition.column,
                    },
                    children: [],
                    references: body ? references(body) : [],
                    comment: comment,
                    commentBlock: commentBlock,
                    definitionBlock: {
                        name: name?.text,
                        start: {
                            byteOffset: child.startIndex,
                            lineNumber: child.startPosition.row,
                            lineOffset: child.startPosition.column,
                        },
                        end: {
                            byteOffset: (body ?? child).startIndex,
                            lineNumber: (body ?? child).startPosition.row,
                            lineOffset: (body ?? child).startPosition.column,
                        },
                        references: [],
                        children: [],
                    }
                });
                break;

            default:
                // recursively look into class bodies, etc.
                extracted.push(...blocks(child));
        }
    }

    return extracted;
}

export function parse(language: "rust" | "go" | "md", code: string): Block[] {
    const parser = new Parser();
    const bufferSize = 64 * 1024 * 1024;
    switch (language) {
        case "rust":
            parser.setLanguage(Rust as any);
            return blocks(parser.parse(code, undefined, { bufferSize }).rootNode);
        case "go":
            parser.setLanguage(Go as any);
            return blocks(parser.parse(code, undefined, { bufferSize }).rootNode);
        case "md":
            parser.setLanguage(Markdown as any);
            return blocks(parser.parse(code, undefined, { bufferSize }).rootNode);
    }
}

export function find(blocks: Block[], accept: (_: Block) => boolean): Block[] {
    const result = [];
    for (const block of blocks) {
        if (accept(block)) {
            result.push(block);
        }
        result.push(...find(block.children, accept));
    }
    return result;
}

export function select(blocks: Block[], selector: string[]): Block[] {
    if (selector.length == 0) {
        return blocks;
    }
    const result: Block[] = [];
    const regex = selector[0][0] == '~' ? new RegExp(selector[0].substring(1)) : null;
    const match = (x: string) => {
        if (regex != null) {
            return regex.test(x);
        } else {
            return x == selector[0];
        }
    }
    for (const block of blocks) {
        if (match(block.name || "")) {
            if (selector.length == 1) {
                result.push(block);
            } else {
                const sub = selector.slice(1);
                if (sub.length == 1 && sub[0] == "#comment") {
                    result.push(block.commentBlock!, block.definitionBlock!)
                } else {
                    const found = select(block.children, sub);
                    result.push(...found);
                }
            }
        } else {
            result.push(...select(block.children, selector));
        }
    }
    return result;
}

export function restore(code: string, blocks: Block[]): string {
    const result = [];
    for (const block of blocks) {
        result.push(code.substring(block.start.byteOffset, block.end.byteOffset).trimEnd());
    }
    return result.join('\n');
}