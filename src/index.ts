interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Dutch Parliament (Tweede Kamer) open data MCP.
 *
 * Source: gegevensmagazijn.tweedekamer.nl — keyless OData v4 (v2.0 model).
 * Base: https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0
 *
 * All entity and field names are Dutch. Common entities:
 *   Persoon     — people / Members of Parliament (Kamerleden)
 *   Fractie     — parliamentary parties / groups
 *   Zaak        — cases / parliamentary matters (motions, bills, questions)
 *   Activiteit  — activities (debates, meetings, committee sessions)
 *   Vergadering — plenary meetings / sessions
 *   Stemming    — votes (one row per party/member per voting round)
 *   Besluit     — decisions (outcome of a deliberation on a Zaak)
 *   Document    — documents (letters, reports, minutes)
 *
 * Common Persoon fields: Id (GUID), Achternaam (surname), Tussenvoegsel (name
 *   infix, e.g. "van der"), Voornamen (given names), Roepnaam (preferred first
 *   name), Initialen (initials), Geslacht (sex), Functie (role, e.g. "Kamerlid",
 *   "Oud Kamerlid"), Geboortedatum (date of birth), Woonplaats (town), Fractielabel.
 * Common Fractie fields: Id, Afkorting (abbreviation, e.g. "VVD"), NaamNL (Dutch
 *   name), NaamEN (English name), AantalZetels (number of seats), DatumActief.
 *
 * OData v4 query semantics (all string args passed through verbatim):
 *   $filter   — e.g. Achternaam eq 'Rutte'  |  contains(Achternaam,'Rut')  |
 *               AantalZetels gt 10  |  startswith(NaamNL,'Groen')
 *   $orderby  — e.g. Achternaam asc  |  GewijzigdOp desc
 *   $select   — comma-separated field names, e.g. Id,Achternaam,Roepnaam
 *   $expand   — navigation properties, e.g. FractieZetel
 *   $top / $skip — paging.
 * String literals in $filter use single quotes; escape an embedded quote by
 * doubling it ('O''Brien'). Results come back under the `value` array.
 * Fetch a single record by its GUID with get_entity_by_id (no guid'' prefix).
 */


const BASE = 'https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0';
const UA = 'pipeworx-mcp-tweedekamer-nl/1.0 (+https://pipeworx.io)';

const ENTITY_DESC =
  'Dutch entity name. Common: Persoon (people/MPs), Fractie (parties), Zaak (cases/motions/bills), Activiteit (activities/debates), Vergadering (meetings), Stemming (votes), Besluit (decisions), Document (documents).';

const tools: McpToolExport['tools'] = [
  {
    name: 'query_entity',
    description:
      'Query a Tweede Kamer (Dutch Parliament) OData v4 entity set with full OData passthrough. ' +
      'Entity names and fields are Dutch. Returns matching records under `value`. ' +
      'Use $filter to subset (e.g. "Achternaam eq \'Rutte\'" or "contains(NaamNL,\'Groen\')"), ' +
      '$select to pick fields, $orderby to sort, $expand for related records. Always set $top to bound responses.',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', description: ENTITY_DESC },
        filter: {
          type: 'string',
          description:
            "OData $filter. eq/ne/gt/lt + contains()/startswith()/endswith(). String literals in single quotes (double an embedded quote). E.g. \"Afkorting eq 'VVD'\", \"contains(Achternaam,'Rut')\", \"AantalZetels gt 10\".",
        },
        orderby: { type: 'string', description: 'OData $orderby, e.g. "Achternaam asc" or "GewijzigdOp desc".' },
        select: { type: 'string', description: 'OData $select: comma-separated Dutch field names, e.g. "Id,Achternaam,Roepnaam,Functie".' },
        expand: { type: 'string', description: 'OData $expand: navigation properties to inline, e.g. "FractieZetel".' },
        top: { type: 'number', description: 'Max records to return (default 25, OData $top).' },
        skip: { type: 'number', description: 'Records to skip for paging (OData $skip).' },
        count: { type: 'boolean', description: 'If true, include total match count as @odata.count.' },
      },
      required: ['entity'],
    },
  },
  {
    name: 'get_entity_by_id',
    description:
      'Fetch one Tweede Kamer record by its GUID id. Pass the entity name and the record Id (a GUID, e.g. "8b3664bd-77e4-468b-af96-f3f4ec27fcce"). Optionally narrow fields with $select or inline related records with $expand.',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', description: ENTITY_DESC },
        id: { type: 'string', description: 'Record GUID, e.g. "8b3664bd-77e4-468b-af96-f3f4ec27fcce".' },
        select: { type: 'string', description: 'OData $select, comma-separated field names.' },
        expand: { type: 'string', description: 'OData $expand, navigation properties to inline.' },
      },
      required: ['entity', 'id'],
    },
  },
  {
    name: 'search_people',
    description:
      'Convenience search over Tweede Kamer members/people (Persoon entity) by name. Matches a case-insensitive substring against surname (Achternaam) and/or preferred first name (Roepnaam). Returns id, name parts, role (Functie) and party label.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name fragment to search for, e.g. "Rutte", "Mark", "Wilders".' },
        field: {
          type: 'string',
          enum: ['achternaam', 'roepnaam', 'both'],
          description: 'Which field to match: achternaam (surname), roepnaam (first name), or both (default).',
        },
        top: { type: 'number', description: 'Max results (default 25).' },
      },
      required: ['name'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'query_entity': {
      const entity = entityName(args);
      const params = new URLSearchParams();
      params.set('$top', String(numArg(args.top, 25)));
      if (strArg(args.filter)) params.set('$filter', strArg(args.filter)!);
      if (strArg(args.orderby)) params.set('$orderby', strArg(args.orderby)!);
      if (strArg(args.select)) params.set('$select', strArg(args.select)!);
      if (strArg(args.expand)) params.set('$expand', strArg(args.expand)!);
      if (args.skip !== undefined) params.set('$skip', String(numArg(args.skip, 0)));
      if (args.count === true) params.set('$count', 'true');
      return tkGet(`${BASE}/${entity}?${params.toString()}`);
    }
    case 'get_entity_by_id': {
      const entity = entityName(args);
      const id = reqStr(args, 'id', '"8b3664bd-77e4-468b-af96-f3f4ec27fcce"').trim().replace(/[^A-Za-z0-9-]/g, '');
      const params = new URLSearchParams();
      if (strArg(args.select)) params.set('$select', strArg(args.select)!);
      if (strArg(args.expand)) params.set('$expand', strArg(args.expand)!);
      const qs = params.toString();
      return tkGet(`${BASE}/${entity}(${id})${qs ? `?${qs}` : ''}`);
    }
    case 'search_people': {
      const term = reqStr(args, 'name', '"Rutte"').replace(/'/g, "''");
      const field = (strArg(args.field) ?? 'both').toLowerCase();
      const clauses: string[] = [];
      if (field === 'achternaam' || field === 'both') clauses.push(`contains(Achternaam,'${term}')`);
      if (field === 'roepnaam' || field === 'both') clauses.push(`contains(Roepnaam,'${term}')`);
      const params = new URLSearchParams({
        $top: String(numArg(args.top, 25)),
        $select: 'Id,Achternaam,Tussenvoegsel,Roepnaam,Initialen,Functie,Fractielabel',
        $filter: clauses.join(' or '),
        $orderby: 'Achternaam asc',
      });
      return tkGet(`${BASE}/Persoon?${params.toString()}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function tkGet(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Tweede Kamer: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function entityName(args: Record<string, unknown>): string {
  return reqStr(args, 'entity', '"Persoon"').trim().replace(/[^A-Za-z0-9_]/g, '');
}

function strArg(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function numArg(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
