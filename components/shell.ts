import * as child_process from "child_process";
import { ComponentArgs, ComponentAttributes, ComponentOutput } from "../types.js";
import { wrap } from "../wrap.js";
import { extractMaybe } from "../extractor.js";

export async function ShellComponent(args: ComponentArgs): Promise<ComponentOutput> {
    const cmd = args.attributes["cmd"];
    const validation = args.attributes["validation"] == true;
    const process = child_process.spawn(cmd, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
        cwd: args.cwd,
    });

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    process.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    await new Promise<void>((resolve, reject) => {
        process.on("error", reject);
        process.on("close", (code) => {
            if (code === 0) resolve();
            if (stderr.includes("panicked at")) { reject(new Error(`${cmd} panicked with code ${code}\n${stderr}`)) }
            resolve()
        });
    });
    let attributes: ComponentAttributes = {};
    if (process.exitCode != 0) {
        if (!validation) {
            throw new Error(`command failed with non-zero exit code: cmd=${cmd}, exit=${process.exitCode}, stdout=${stdout}, stderr=${stderr}`);
        } else {
            attributes["failed"] = true;
        }
    }
    const ext = args.attributes["ext"];
    const fakePath = ext == null ? null : "test" + ext;
    return {
        content: wrap(extractMaybe(validation ? (stdout + '\n' + stderr) : stdout, args.attributes["selector"], fakePath), args.attributes),
        attributes
    };
}