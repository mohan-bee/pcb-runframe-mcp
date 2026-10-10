# PCB Runframe MCP

An MCP App that lets ChatGPT run TSX circuit code and show an interactive PCB viewer directly in the conversation.

The public product and repository name intentionally avoid using `tscircuit` as a prefix. Internally, the viewer embeds the official [RunFrame](https://github.com/tscircuit/runframe).

## First milestone

Ask ChatGPT to build an LED circuit. The `render_circuit` tool receives complete TSX, runs it in RunFrame, and shows PCB, schematic, 3D, and code tabs in ChatGPT.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run build
npm start
```

The MCP endpoint is `http://localhost:8787/mcp`. Test it with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest
```

For ChatGPT development, expose port 8787 through an HTTPS tunnel and add `https://YOUR_HOST/mcp` as a custom MCP server.

## Tool

### `render_circuit`

Accepts complete TSX circuit source and an optional title. It returns structured data for an embedded MCP Apps component backed by RunFrame.

Try prompting:

> Build a small autorouted 5 V LED circuit with a 330 ohm resistor and show me the PCB.

An example source file is included at [`examples/led.tsx`](examples/led.tsx).

## Architecture

```text
ChatGPT -> render_circuit -> MCP structured result -> embedded RunFrame -> PCB / schematic / 3D
```

This repository follows the [OpenAI MCP server and UI quickstart](https://developers.openai.com/plugins/build/app-quickstart) and uses the portable MCP Apps UI bridge.

## Scope

This initial version deliberately has one focused tool and no authentication or persistence. Deployment, exports, durable projects, and richer editing tools can be added after the in-chat LED flow is validated.

## License

MIT
