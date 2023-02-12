import { serve } from "https://deno.land/std@0.176.0/http/server.ts"

const port = parseInt(Deno.env.get("PORT") ?? "8000");

serve((_req) => new Response("Hello, world"), { port });
