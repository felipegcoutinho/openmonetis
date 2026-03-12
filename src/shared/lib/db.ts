import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as {
	db?: NodePgDatabase<typeof schema>;
	pool?: Pool;
};

let _db: NodePgDatabase<typeof schema> | undefined;
let _pool: Pool | undefined;

function getDb() {
	if (_db) return _db;

	const { DATABASE_URL } = process.env;

	if (!DATABASE_URL) {
		throw new Error("DATABASE_URL env variable is not set");
	}

	_pool = globalForDb.pool ?? new Pool({ connectionString: DATABASE_URL });
	_db = globalForDb.db ?? drizzle(_pool, { schema });

	if (process.env.NODE_ENV !== "production") {
		globalForDb.pool = _pool;
		globalForDb.db = _db;
	}

	return _db;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
	get(_, prop) {
		return Reflect.get(getDb(), prop);
	},
});

export { schema };
