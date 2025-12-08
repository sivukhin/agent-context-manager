import { Db } from "./db.js";

export type ComponentAttributes = {
    [K: string]: any
}

export interface ComponentData {
    id: string;
    component: string;
    attributes: ComponentAttributes;
    content: string;
}

export type ComponentArgs = {
    session: ContextSession;
    cwd: string;
    attributes: ComponentAttributes;
    content: ComponentOutput;
}

export type ComponentOutput = {
    content: string;
    attributes?: ComponentAttributes;
}
export interface ContextSession {
    db: Db,
    getInputById(id: string): Promise<string | null>;
    getOutputById(id: string): Promise<ComponentOutput | null>;
    getComponentByData(data: ComponentData): Promise<ComponentOutput | null>,
    setComponent(data: ComponentData, output: ComponentOutput): Promise<void>;
}

function deep(attrs: ComponentAttributes, key: string): any[] {
    let result = [];
    for (const entry of Object.entries(attrs)) {
        if (entry[0] == key) {
            result.push(entry[1]);
        } else if (typeof entry[1] == "object") {
            result.push(...deep(entry[1] as ComponentAttributes, key))
        }
    }
    return result;
}