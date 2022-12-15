import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
    name: 'css-global-properties',
    entries: [
        './lib/index',
    ],
    declaration: true,
    rollup: {
        emitCJS: true,
    },
})
