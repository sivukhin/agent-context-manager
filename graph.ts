export interface Graph {
    addNode(a: string): void;
    addEdge(a: string, b: string): void;
    nodes(): string[];
    nodesTopo(): string[];
    reachable(node: string): Set<string>;
}

export function graph(): Graph {
    let edges = new Map<string, Set<string>>();
    let traverse = (v: string, used: Set<string>, result: string[]) => {
        if (used.has(v)) {
            return;
        }
        used.add(v);
        for (const edge of edges.get(v) ?? []) {
            traverse(edge, used, result);
        }
        result.push(v);
    }
    let addNode = (a: string) => {
        let value = edges.get(a);
        if (value == null) {
            edges.set(a, new Set());
        }
    };
    let addEdge = (a: string, b: string) => {
        let value = edges.get(a);
        if (value == null) {
            edges.set(a, new Set());
            value = edges.get(a);
        }
        value!.add(b);
    };
    let nodes = (): string[] => {
        let nodes = new Set<string>();
        for (const key of edges.keys()) {
            nodes.add(key)
        }
        for (const values of edges.values()) {
            for (const value of values) {
                nodes.add(value);
            }
        }
        return Array.from(nodes.keys());
    };
    let nodesTopo = (): string[] => {
        let used = new Set<string>();
        let result: string[] = [];
        for (const node of nodes()) {
            if (used.has(node)) {
                continue;
            }
            traverse(node, used, result);
        }
        return result;
    };
    return {
        addNode,
        addEdge,
        nodes,
        nodesTopo,
        reachable(node) {
            const used = new Set<string>();
            traverse(node, used, []);
            return used;
        }
    }
}