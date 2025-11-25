import { ComponentAttributes } from "./types.js";

export function wrap(content: string, attrs: ComponentAttributes): string {
    if (attrs["no-wrap"] == true) {
        return content;
    }
    const header = [];
    if (attrs["url"] != null) {
        header.push(`url=${attrs['url']}`);
    }
    if (attrs["issue"] != null) {
        header.push(`issue=${attrs['issue']}`);
    }
    if (attrs["pr"] != null) {
        header.push(`pr=${attrs['pr']}`);
    }
    if (attrs["cmd"] != null) {
        header.push(`cmd=${attrs['cmd']}`);
    }
    if (attrs["path"] != null) {
        header.push(`path=${attrs['path']}`);
    }
    if (attrs["selector"] != null) {
        header.push(`selector=${attrs['selector']}`);
    }
    return `## ${header.join('; ')}\n${content}`;
}