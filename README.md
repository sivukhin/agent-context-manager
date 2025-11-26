# agent-context-manager

A tiny, MDX-flavored way to build, reuse, and analyze complex context for LLM tasks.

Instead of writing long, flat prompts, you compose a tree of JSX-like components: some fetch or extract context (File, Link, Shell, GitHub) and others act as agentic steps (Outline, Review, Code, Research). The result is a structured context graph you can rearrange freely, cache safely, and account precisely.

- Familiar authoring: use MDX-like JSX to wire context
- Tree-shaped context: group, nest, summarize, and review independently
- Reusable and cost-aware: results are cached in Turso and LLM usage is tracked
- Flexible providers: local files, URLs, GitHub PRs/issues, shell commands
- Agentic steps: outline, review, research, and code generation

Note: sequential workflows (do X, then Y, then Z strictly in order with stateful steps) are not the primary focus of this format.


## Why

Managing big contexts is hard:
- You want to combine relevant files, diffs, links, and generated summaries
- You want to move blocks around without re-paying LLM costs
- You want visibility into which step spent how much and when

agent-context-manager gives you declarative, composable snippets that form a tree of context, with caching and cost tracking built in. You get more control and flexibility over the entire context management process.


## What it looks like

Here is a compact MDX-style example that mixes Outline, Code, Shell, Link, and File:

```mdx
---
name: example
---

<Output path="docs/outline.md">
  <Outline model="anthropic/claude-sonnet-4-5" temperature={0.2}>
    ## Context
    Generate a short outline for the API docs.

    ## Files
    <File path="internal/server.go" selector="ServeHTTP#comment" />
    <Link url="https://example.com/public-api" />
  </Outline>
</Output>

<Output path="internal/healthz.go">
  <Code model="openai/gpt-5" language="go" temperature={0}>
    ## Context
    Create a minimal /healthz HTTP handler consistent with our server.

    ## Files
    <File path="docs/outline.md" />
    <File path="internal/server.go" selector="ServeHTTP" />
  </Code>
</Output>

<Shell cmd="go test ./..." />

<Output path="docs/review.md">
  <Review model="openai/gpt-5" temperature={0}>
    ## Context
    Perform a concise critical review of recent changes.

    ## Files
    <Shell cmd="git --no-pager diff --unified=0 HEAD~1..HEAD" />
    <File path="internal/healthz.go" />
  </Review>
</Output>
```

- File reads local files. For Go and Rust you can target code blocks via selector (see “Code extraction” below).
- Link fetches and includes remote content.
- Outline produces structured notes to simplify later steps.
- Code generates code only (no backticks/text), in a specified language.
- Shell runs a command and captures its stdout into the context.
- Output writes the final content to disk.


## Key ideas

- Tree-shaped context: you can nest components. For instance, generate an Outline from a group of files and links, then feed that into Code to produce an implementation, and later Review a diff or selected files.
- Reordering is (mostly) free: results are keyed by component type + attributes + content hash. Move blocks around and reuse results without paying for re-evaluation.
- Clear provenance: providers wrap results with a small header (e.g., “## path=..., url=..., cmd=...”), making it easy to see origins inside the assembled context.


## Components at a glance

Context providers
- `<File path=... or glob=... selector=... />`
- `<Link url=... />`
- `<Shell cmd=... />`
- `<GitHubIssue issue="owner/repo/123" />`
- `<GitHubPr pr="owner/repo/456" />` with options:
  - title, description, diff booleans to include/exclude
  - files=[...] to fetch specific files from the PR’s head SHA
  - selector applies to fetched files (Rust/Go aware)

Agentic actions (require model=...)
- `<Outline model="..." temperature={...} />`
- `<Review model="..." temperature={...} />`
- `<Research model="..." temperature={...} />`
- `<Code model="..." language="..." temperature={...} />`

Utility
- `<Output path="...">` writes its inner content to a file


## Cost tracking and caching

agent-context-manager stores:
- Component results (context_components table)
- LLM calls, usage, and cost (llm_calls table)

Example Turso query
```sh
turso> SELECT provider, model, component_name, cost FROM llm_calls
┌───────────┬───────────────────┬────────────────┬────────┐
│ provider  │ model             │ component_name │ cost   │
├───────────┼───────────────────┼────────────────┼────────┤
│ openai    │ gpt-5             │ Code           │ 0.1210 │
│ openai    │ gpt-5             │ Code           │ 0.0947 │
│ openai    │ gpt-5             │ Code           │ 0.0789 │
│ anthropic │ claude-sonnet-4-5 │ Outline        │ 0.0662 │
│ anthropic │ claude-sonnet-4-5 │ Outline        │ 0.0580 │
│ openai    │ gpt-5             │ Review         │ 0.0453 │
└───────────┴───────────────────┴────────────────┴────────┘
```

Notes
- Pricing is computed per provider/model using token usage (input, cached input, output).
- Component results are addressed by a stable hash across component name, sorted attributes, and content.
- You can invalidate a cached result programmatically.

## Built with

- [TypeScript](https://github.com/microsoft/TypeScript)
- [AI SDK](https://github.com/vercel/ai) (OpenAI, Anthropic, Google) for text generation
- [Tree-sitter](https://github.com/tree-sitter/tree-sitter) (Go and Rust extractors)
- [Turso](https://github.com/tursodatabase/turso) (@tursodatabase/database) for caching and analytics

## Examples

Small, focused building blocks:
```mdx
<Outline model="anthropic/claude-sonnet-4-5">
  ## Context
  Summarize core responsibilities of the HTTP layer.

  ## Files
  <File path="internal/server.go" selector="ServeHTTP#comment" />
</Outline>
```

Combine external docs with local code:
```mdx
<Review model="openai/gpt-5">
  ## Context
  Critical review of the patch.

  ## Files
  <Shell cmd="git --no-pager diff --unified=0 HEAD~1..HEAD" />
  <Link url="https://example.com/api-guidelines" />
</Review>
```

Generate code from an outline:
```mdx
<Code model="openai/gpt-5" language="go" temperature={0}>
  ## Context
  Implement a health check endpoint based on the outline.

  ## Files
  <File path="docs/outline.md" />
</Code>
```
