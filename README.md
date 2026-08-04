# mcp-tweedekamer-nl

Dutch Parliament (Tweede Kamer) open data MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Tweedekamer Nl data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
