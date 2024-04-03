
const esbuild = require('esbuild')
const path = require('path');
const { postOutputFiles } = require('./post');

const outdir = path.resolve(__dirname, '..', 'modules');

esbuild.outdir = outdir;

const basePath = path.resolve(__dirname, '..')

const configs = [
    {
        format: 'esm',
        outdir: `${basePath}/modules/es`,
        entryPoints: [
            `${basePath}/lib/index.ts`,
            `${basePath}/lib/exec.worker.ts`,
            `${basePath}/lib/mat.ts`,
            `${basePath}/lib/log.ts`,
        ],
        bundle: false,
        write: true,
        minify: false,
    },
    {
        format: 'cjs',
        outdir: `${basePath}/modules/commonjs`,
        entryPoints: [
            `${basePath}/lib/index.ts`,
            `${basePath}/lib/exec.worker.ts`,
            `${basePath}/lib/mat.ts`,
            `${basePath}/lib/log.ts`,
        ],
        bundle: false,
        write: true,
        minify: false,
    },
    {
        format: 'iife',
        outdir: `${basePath}/modules/iife`,
        entryPoints: [
            `${basePath}/lib/index.ts`,
            `${basePath}/lib/exec.worker.ts`,
        ],
        bundle: true,
        write: true,
        globalName: 'PixelWind',
        minify: false,
    }
];

async function start() {

    const startBuildTimeStamp = Date.now();

    for (const config of configs) {
        await esbuild.build(config);
    }

    postOutputFiles(outdir, startBuildTimeStamp);
}


void start();