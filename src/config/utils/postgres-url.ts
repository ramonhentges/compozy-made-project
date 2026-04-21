export interface ParsedPostgresUrl {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export function parsePostgresUrl(url: string): ParsedPostgresUrl {
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid DATABASE_URL format: ${url}`);
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
}