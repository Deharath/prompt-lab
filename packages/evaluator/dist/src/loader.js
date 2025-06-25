/* eslint-disable max-len */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
// eslint-disable-next-line import/no-extraneous-dependencies
import ts from 'typescript';
const require = createRequire(import.meta.url);
function loadTs(file) {
    const source = readFileSync(file, 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
    });
    const module = { exports: {} };
    const fn = vm.runInThisContext(`(function(exports, require, module){${outputText}\n})`, {
        filename: file,
    });
    fn(module.exports, require, module);
    return module.exports;
}
export function discoverMetrics(dir = fileURLToPath(new URL('./metrics', import.meta.url))) {
    const files = readdirSync(dir);
    const metrics = new Map();
    files
        .filter((f) => (f.endsWith('.js') || f.endsWith('.ts')) && !f.endsWith('.d.ts'))
        .forEach((file) => {
        const name = basename(file, extname(file));
        let mod;
        if (file.endsWith('.ts')) {
            mod = loadTs(join(dir, file));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-dynamic-require, global-require
            mod = require(join(dir, file));
        }
        if (mod && mod.default) {
            metrics.set(name, mod.default);
        }
    });
    return metrics;
}
export async function runMetric(name, args, dir) {
    const metrics = discoverMetrics(dir);
    const metric = metrics.get(name);
    if (!metric) {
        throw new Error(`Metric not found: ${name}`);
    }
    return metric.evaluate(args);
}
