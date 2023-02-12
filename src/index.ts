import { serve } from 'https://deno.land/std@0.176.0/http/server.ts';
import { Redis } from 'https://deno.land/x/upstash_redis@v1.19.3/mod.ts';
import { Query } from 'https://deno.land/x/sql_builder@v1.9.2/mod.ts';
import { connect } from 'npm:@planetscale/database@^1.4';

const port = parseInt(Deno.env.get('PORT') ?? '8000');
const redis = Redis.fromEnv();
const config = {
	host: Deno.env.get('HOST'),
	username: Deno.env.get('USERNAME'),
	password: Deno.env.get('PASSWORD'),
};
const conn = connect(config);

serve(async (_req) => {
	// Redis
	const setRes = [];
	const uuid = crypto.randomUUID();
	console.log('set...');
	for (let i = 0; i < 100; i++) {
		performance.mark('redis-set-1');
		await redis.set('foo', uuid);
		performance.mark('redis-set-2');
		setRes.push(performance.measure('redis-set', 'redis-set-1', 'redis-set-2').duration);
	}

	const readRes = [];
	console.log('read...');
	for (let i = 0; i < 100; i++) {
		performance.mark('redis-read-1');
		await redis.get<string>('foo');
		performance.mark('redis-read-2');
		readRes.push(performance.measure('redis-read', 'redis-read-1', 'redis-read-2').duration);
	}

	// Planetscale

	const builder = new Query();
	const product = builder.table('products').select('*').build();

	const selectRes = [];
	console.log('select...');
	for (let i = 0; i < 100; i++) {
		performance.mark('planetscale-1');
		await conn.execute(product);
		performance.mark('planetscale-2');
		selectRes.push(performance.measure('planetscale', 'planetscale-1', 'planetscale-2').duration);
	}

	return new Response(
		JSON.stringify({ read: Math.min(...readRes), set: Math.min(...setRes), select: Math.min(...selectRes) }),
		{ headers: { 'content-type': 'application/json' } },
	);
}, { port });
