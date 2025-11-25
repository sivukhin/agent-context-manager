export type ComponentAttributes = {
    [K: string]: any
}

export type ComponentArgs = {
    cwd: string;
    attributes: ComponentAttributes;
    content: string;
}