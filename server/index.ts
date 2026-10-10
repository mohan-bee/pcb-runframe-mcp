import { createServer } from "node:http"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { z } from "zod"

const WIDGET_URI = "ui://pcb-runframe/viewer-v1.html"
const widgetHtml = readFileSync(fileURLToPath(new URL("../web/widget.html", import.meta.url)), "utf8")

const inputSchema = {
  code: z.string().min(1).max(100_000).describe("Complete TSX circuit source code to run in the PCB viewer."),
  title: z.string().min(1).max(120).optional().describe("Short human-readable circuit name."),
}

const outputSchema = {
  code: z.string(),
  title: z.string(),
}

function createPcbServer() {
  const server = new McpServer(
    { name: "pcb-runframe", version: "0.1.0" },
    { instructions: "Use render_circuit when the user wants to create, inspect, or edit a PCB. Pass complete runnable TSX source." },
  )

  registerAppResource(server, "pcb-runframe-viewer", WIDGET_URI, {}, async () => ({
    contents: [{
      uri: WIDGET_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: widgetHtml,
      _meta: {
        ui: {
          prefersBorder: false,
          csp: { frameDomains: ["https://runframe.tscircuit.com"] },
        },
        "openai/ui": { availableDisplayModes: ["inline", "fullscreen"] },
      },
    }],
  }))

  registerAppTool(server, "render_circuit", {
    title: "Render PCB circuit",
    description: "Runs complete TSX circuit code and displays its live PCB, schematic, 3D, and code views inside the conversation.",
    inputSchema,
    outputSchema,
    _meta: { ui: { resourceUri: WIDGET_URI } },
  }, async ({ code, title }: { code: string; title?: string }) => {
    const cleanCode = code.trim()
    const cleanTitle = title?.trim() || "Untitled PCB"
    return {
      content: [{ type: "text", text: `Rendered ${cleanTitle} in the interactive PCB viewer.` }],
      structuredContent: { code: cleanCode, title: cleanTitle },
    }
  })

  return server
}

const port = Number(process.env.PORT ?? 8787)
const MCP_PATH = "/mcp"

const httpServer = createServer(async (req, res) => {
  if (!req.url) return void res.writeHead(400).end("Missing URL")
  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`)

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    }).end()
    return
  }

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ name: "PCB Runframe MCP", endpoint: MCP_PATH }))
    return
  }

  if (url.pathname === MCP_PATH && req.method && ["POST", "GET", "DELETE"].includes(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id")
    const server = createPcbServer()
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
    res.on("close", () => { void transport.close(); void server.close() })
    try {
      await server.connect(transport)
      await transport.handleRequest(req, res)
    } catch (error) {
      console.error("MCP request failed", error)
      if (!res.headersSent) res.writeHead(500).end("Internal server error")
    }
    return
  }

  res.writeHead(404).end("Not Found")
})

httpServer.listen(port, () => console.log(`PCB Runframe MCP listening on http://localhost:${port}${MCP_PATH}`))
