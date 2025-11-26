import { connect, Database } from "@tursodatabase/database";
import { customAlphabet } from "nanoid";
import { ComponentAttributes } from "./types.js";
import { LanguageModelUsage } from "ai";
import { price } from "./pricing.js";
import { createHash } from "crypto";

const nanoid = customAlphabet('0123456789abcdef');

interface ComponentData {
    id: string;
    component: string;
    attributes: ComponentAttributes;
    content: string;
}

interface LlmData {
    model: string;
    component: string;
    usage: LanguageModelUsage;
    request: string;
    response: string;
    start: number;
    duration: number;
}

export interface Db {
    getComponent(data: ComponentData): Promise<string>;
    setComponent(data: ComponentData, result: string): Promise<void>;
    invalidateComponent(data: ComponentData): Promise<void>;
    recordLlm(data: LlmData): Promise<void>;
}

function hashString(s: string): string {
    return createHash('sha256').update(s).digest('hex');
}

function hashComponent(component: ComponentData) {
    let str = [];
    str.push(component.id);
    const attributes = Object.entries(component.attributes);
    attributes.sort((a, b) => a[0].localeCompare(b[0]));
    for (const attribute of attributes) {
        str.push(`${attribute[0]}=${JSON.stringify(attribute[1])}`);
    }
    str.push(component.content);
    return hashString(str.join(';'));
}

export async function connectDb(path: string): Promise<Db> {
    const database = await connect(path);
    await database.exec(`CREATE TABLE IF NOT EXISTS llm_calls (
        id TEXT PRIMARY KEY,
        provider TEXT,
        model TEXT,
        component_name TEXT,
        request TEXT,
        response TEXT,
        input_tokens INTEGER,
        input_tokens_cached INTEGER,
        output_tokens INTEGER,
        cost FLOAT,
        start_time_utc_ms INTEGER,
        duration_ms INTEGER
    )`);
    await database.exec(`CREATE TABLE IF NOT EXISTS context_components (
        id TEXT,
        invalidation_nonce INTEGER,
        component_name TEXT,
        hash TEXT,
        attributes TEXT,
        content TEXT,
        result TEXT,
        PRIMARY KEY (hash, invalidation_nonce)
    )`);

    return {
        async getComponent(data) {
            const hash = hashComponent(data);
            const result = await database.prepare(`SELECT result FROM context_components WHERE hash = ? and invalidation_nonce = ''`).get([hash]);
            return result?.result;
        },
        async setComponent(data, result) {
            const hash = hashComponent(data);
            await database.prepare(`INSERT INTO context_components VALUES (
                :id,
                :invalidation,
                :component,
                :hash,
                :attributes,
                :content,
                :result
            )`).all({
                id: data.id,
                invalidation: '',
                component: data.component,
                hash: hash,
                attributes: JSON.stringify(data.attributes),
                content: data.content,
                result: result,
            });
        },
        async invalidateComponent(data) {
            const hash = hashComponent(data);
            await database.prepare(`UPDATE context_components 
                SET invalidation_nonce = :invalidation 
                WHERE hash = :hash AND invalidation_nonce = ''
            `).all({
                invalidation: nanoid(16),
                hash: hash,
            });
        },
        async recordLlm(data) {
            await database
                .prepare(`INSERT INTO llm_calls VALUES (
                    :id, 
                    :provider, 
                    :model, 
                    :component, 
                    :request, 
                    :response, 
                    :inputTokens, 
                    :inputTokensCached, 
                    :outputTokens, 
                    :cost, 
                    :start, 
                    :duration
                )`)
                .all({
                    id: nanoid(8),
                    provider: data.model.split('/')[0],
                    model: data.model.split('/')[1],
                    component: data.component,
                    request: data.request,
                    response: data.response,
                    inputTokens: data.usage.inputTokens,
                    inputTokensCached: data.usage.cachedInputTokens ?? 0,
                    outputTokens: data.usage.outputTokens,
                    cost: price(data.model, data.usage),
                    start: data.start,
                    duration: data.duration,
                });
        },
    }
}