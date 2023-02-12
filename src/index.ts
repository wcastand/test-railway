import { serve } from 'https://deno.land/std@0.176.0/http/server.ts';
import { Redis } from 'https://deno.land/x/upstash_redis@v1.19.3/mod.ts';
import { Query } from 'https://deno.land/x/sql_builder@v1.9.2/mod.ts';
import { connect } from 'npm:@planetscale/database@^1.4';

const redis = new Redis({
	url: Deno.env.get('UPSTASH_REDIS_REST_URL') ?? '',
	token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? '',
});

const config = {
	host: Deno.env.get('HOST'),
	username: Deno.env.get('USERNAME'),
	password: Deno.env.get('PASSWORD'),
};

const conn = connect(config);

const port = parseInt(Deno.env.get('PORT') ?? '8000');

serve(async (_req) => {
	const builder = new Query();
	const product = builder.table('products').select('*').build();

	performance.measure('redis-set');
	await redis.set('foo', crypto.randomUUID());
	const set1 = performance.measure('redis-set');

	performance.measure('redis-read');
	await redis.get<string>('foo');
	const read1 = performance.measure('redis-read');

	performance.measure('redis-read-2');
	await redis.get<string>('foo');
	const read2 = performance.measure('redis-read-2');

	performance.measure('planetscale');
	await conn.execute(product);
	const select1 = performance.measure('planetscale');

	return new Response(
		JSON.stringify({ read2: read2.duration, read1: read1.duration, set1: set1.duration, select1: select1.duration }),
		{
			headers: { 'content-type': 'application/json' },
		},
	);
}, { port });
