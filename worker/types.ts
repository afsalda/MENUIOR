export interface Statement {
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface Env {
  DB: { prepare(sql: string): Statement };
  BUCKET: {
    put(
      key: string,
      bytes: ArrayBuffer,
      options: { httpMetadata: { contentType: string } },
    ): Promise<unknown>;
    get(
      key: string,
    ): Promise<{
      body: ReadableStream;
      httpMetadata?: { contentType?: string };
    } | null>;
  };
  ASSETS: { fetch(request: Request): Promise<Response> };
  ADMIN_EMAIL: string;
}
