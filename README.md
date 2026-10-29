# mcp-tweedekamer-nl

Dutch Parliament (Tweede Kamer) open data MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1857+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

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

Both URLs reach the same gateway and the same 1857+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/tweedekamer_nl_query_entity \
  -H 'Content-Type: application/json' \
  -d '{"entity":"Persoon","filter":"Achternaam eq '\''Rutte'\''","select":"Id,Achternaam,Roepnaam,Functie","top":10}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/tweedekamer_nl_query_entity`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-tweedekamer-nl` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/tweedekamer-nl/mcp` endpoint shown above. It needs network access;
there is no offline mode.

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

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

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
