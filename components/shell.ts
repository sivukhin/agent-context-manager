import * as child_process from "child_process";
import { ComponentArgs } from "../types.js";
import { wrap } from "../wrap.js";

export async function ShellComponent(args: ComponentArgs): Promise<string> {
    const cmd = args.attributes["cmd"];
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
    if (process.exitCode != 0) {
        throw new Error(`command failed with non-zero exit code: cmd=${cmd}, exit=${process.exitCode}, stdout=${stdout}, stderr=${stderr}`);
    }
    return wrap(stdout, args.attributes);
}