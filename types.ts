import { Db } from "./db.js";

export type ComponentAttributes = {
    [K: string]: any
}

export type ComponentArgs = {
    db: Db;
    cwd: string;
    attributes: ComponentAttributes;
    content: string;
}