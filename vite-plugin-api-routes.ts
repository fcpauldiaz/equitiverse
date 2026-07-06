import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import * as esbuild from 'esbuild'
import type { Plugin } from 'vite'

const SSR_RENDERER_PATTERN =
  /function ssrRenderer\(\{ req \}\) \{\n\treturn fetch\(req, \{ viteEnv: "ssr" \}\);\n\}/

const SSR_RENDERER_PATCH = String.raw`async function ssrRenderer({ req }) {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    const { handleApiRequest } = await import("./chunks/_/api-handlers.mjs");
    const request = new Request(url.href, {
      method: req.method,
      headers: new Headers(req.headers),
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
      duplex: req.body ? "half" : undefined,
    });
    const apiResponse = await handleApiRequest(request);
    if (apiResponse) {
      return apiResponse;
    }
  }
  return fetch(req, { viteEnv: "ssr" });
}`

async function bundleApiHandlers(rootDir: string) {
  const entry = resolve(rootDir, 'server/api-handlers.ts')
  const outfile = resolve(rootDir, '.output/server/chunks/_/api-handlers.mjs')

  await mkdir(dirname(outfile), { recursive: true })

  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    alias: {
      '#': resolve(rootDir, 'src'),
    },
  })
}

async function patchSsrRenderer(rootDir: string) {
  const indexPath = resolve(rootDir, '.output/server/index.mjs')
  const code = await readFile(indexPath, 'utf8')

  if (!SSR_RENDERER_PATTERN.test(code)) {
    throw new Error('Could not patch ssrRenderer in .output/server/index.mjs')
  }

  await writeFile(indexPath, code.replace(SSR_RENDERER_PATTERN, SSR_RENDERER_PATCH))
}

export async function applyApiRouteProductionFix(rootDir: string) {
  await bundleApiHandlers(rootDir)
  await patchSsrRenderer(rootDir)
}

export function apiRoutesPlugin(): Plugin {
  return {
    name: 'equitiverse-api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          next()
          return
        }

        try {
          const { handleApiRequest } = await import('../server/api-handlers.ts')
          const host = req.headers.host ?? 'localhost:3000'
          const request = new Request(`http://${host}${req.url}`, {
            method: req.method,
            headers: req.headers as HeadersInit,
          })
          const response = await handleApiRequest(request)

          if (!response) {
            next()
            return
          }

          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          next(error)
        }
      })
    },
  }
}
