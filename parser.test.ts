import { describe, it, expect } from 'vitest'
import { parse, restore } from "./parser.js";
import { extract } from './extractor.js';
import * as fs from 'fs';
import path from 'path';

describe('rust_parse()', () => {
    it('parse comments', () => {
        const result = parse("rust", `
/// multi-line
/// doc comment
fn test() {}
`);
        expect(result).toEqual([
            {
                name: 'test',
                start: { byteOffset: 32, lineNumber: 3, lineOffset: 0 },
                end: { byteOffset: 44, lineNumber: 3, lineOffset: 12 },
                children: [],
                references: [],
                comment: '/// multi-line\n/// doc comment\n',
                definitionBlock: {
                    name: "test",
                    references: [],
                    children: [],
                    end: {
                        byteOffset: 42,
                        lineNumber: 3,
                        lineOffset: 10,
                    },
                    start: {
                        byteOffset: 32,
                        lineNumber: 3,
                        lineOffset: 0,
                    },
                },
                commentBlock: {
                    references: [],
                    children: [],
                    end: {
                        byteOffset: 32,
                        lineNumber: 3,
                        lineOffset: 0,
                    },
                    start: {
                        byteOffset: 1,
                        lineNumber: 1,
                        lineOffset: 0,
                    },
                }
            }
        ])
    });
})

describe('go_parse()', () => {
    it('parse comments', () => {
        const code = `
/// multi-line
/// doc comment
func test() {
    a := 1
}
`;
        const result = parse("go", code);
        expect(extract("go", code, "test#comment")).toEqual(`/// multi-line
/// doc comment
func test()`)
        expect(result).toEqual([
            {
                name: 'test',
                start: { byteOffset: 32, lineNumber: 3, lineOffset: 0 },
                end: { byteOffset: 58, lineNumber: 5, lineOffset: 1 },
                children: [],
                references: [],
                comment: '/// multi-line\n/// doc comment\n',
                definitionBlock: {
                    name: "test",
                    references: [],
                    children: [],
                    end: {
                        byteOffset: 44,
                        lineNumber: 3,
                        lineOffset: 12,
                    },
                    start: {
                        byteOffset: 32,
                        lineNumber: 3,
                        lineOffset: 0,
                    },
                },
                commentBlock: {
                    references: [],
                    children: [],
                    end: {
                        byteOffset: 31,
                        lineNumber: 2,
                        lineOffset: 15,
                    },
                    start: {
                        byteOffset: 1,
                        lineNumber: 1,
                        lineOffset: 0,
                    },
                }
            }
        ])
    });
})


describe('markdown', () => {
    it("parse", () => {
        const content = `
# A

a content

## B

b content

# C

c content

# D

d content`;
        expect(extract("md", content, "B")).toEqual(`## B

b content`)
    })
})