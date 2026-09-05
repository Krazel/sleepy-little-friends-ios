// Use the same Vite/Vinext build and export APIs as the CLI, but allow Node
// to shut down naturally. The CLI's immediate process.exit(0) races native
// libuv worker cleanup on Windows (UV_HANDLE_CLOSING assertion).
process.env.NODE_ENV='production';
const {createBuilder}=await import('vite');
const {runPrerender}=await import('../node_modules/vinext/dist/build/run-prerender.js');
const builder=await createBuilder({logLevel:'warn'});
await builder.buildApp();
const result=await runPrerender({root:process.cwd()});
if(!result||result.routes.some(route=>route.status==='error'))throw new Error('Static export failed.');
await import('./pwa.mjs');
console.log('Production build and offline package complete.');

