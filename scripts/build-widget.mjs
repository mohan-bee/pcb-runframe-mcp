import { copyFile, mkdir } from "node:fs/promises"

await mkdir("dist/web", { recursive: true })
await copyFile("web/widget.html", "dist/web/widget.html")
