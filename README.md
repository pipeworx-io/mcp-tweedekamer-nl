# mcp-tweedekamer-nl

Dutch Parliament (Tweede Kamer) open data MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1679+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `query_entity` | Query a Tweede Kamer (Dutch Parliament) OData v4 entity set with full OData passthrough. Entity names and fields are Dutch. Returns matching records under `value`. Use $filter to subset (e.g. "Achternaam eq 'Rutte'" or "contains(NaamNL,'Groen')"), $select to pick fields, $orderby to sort, $expand for related records. Always set $top to bound responses. |
| `get_entity_by_id` | Fetch one Tweede Kamer record by its GUID id. Pass the entity name and the record Id (a GUID, e.g. "8b3664bd-77e4-468b-af96-f3f4ec27fcce"). Optionally narrow fields with $select or inline related records with $expand. |
| `search_people` | Convenience search over Tweede Kamer members/people (Persoon entity) by name. Matches a case-insensitive substring against surname (Achternaam) and/or preferred first name (Roepnaam). Returns id, name parts, role (Functie) and party label. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "tweedekamer-nl": {
      "url": "https://gateway.pipeworx.io/tweedekamer-nl/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/tweedekamer-nl/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1679+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/tweedekamer_nl_query_entity \
  -H 'Content-Type: application/json' \
  -d '{"entity":"Persoon","filter":"Achternaam eq '\''Rutte'\''","select":"Id,Achternaam,Roepnaam,Functie","top":10}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/tweedekamer_nl_query_entity`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "tweedekamer-nl": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-tweedekamer-nl"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-tweedekamer-nl
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Tweedekamer Nl data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
