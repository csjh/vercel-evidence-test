import { browser, building } from '$app/environment';
import {
	tableFromIPC,
	initDB,
	setParquetURLs,
	query,
	updateSearchPath
} from '@evidence-dev/universal-sql/client-duckdb';

const database_initialization = (async () => {
	let renderedFiles = {};

	console.time("database initialization");
	if (!browser) {
		const { readFile } = await import('fs/promises');
		({ renderedFiles } = JSON.parse(
			await readFile('../../static/data/manifest.json', 'utf-8').catch(() => '{}')
		));
		console.timeLog("database initialization", "read manifest")
	} else {
		const res = await fetch('/data/manifest.json');
		if (res.ok) ({ renderedFiles } = await res.json());
		console.timeLog("database initialization", "read manifest")
	}
	renderedFiles.main = ['/bikes.parquet'];

	await initDB();
	console.timeLog("database initialization", "initialized duckdb")
	await setParquetURLs(renderedFiles);
	console.timeLog("database initialization", "set parquet urls")
	await updateSearchPath(Object.keys(renderedFiles));
	console.timeEnd("database initialization")
})();

/** @satisfies {import("./$types").LayoutLoad} */
export const load = async ({
	fetch,
	data: { customFormattingSettings, routeHash, isUserPage, evidencemeta }
}) => {
	console.time("layout load")
	if (!browser) await database_initialization;

	const data = {};

	// let SSR saturate the cache first
	if (!building && browser && isUserPage) {
		await Promise.all(
			evidencemeta.queries?.map(async ({ id }) => {
				const res = await fetch(`/api/${routeHash}/${id}.arrow`);
				if (res.ok) data[id] = (await tableFromIPC(res)).toArray();
			}) ?? []
		);
		console.timeLog("layout load", "fetched all queries")
	}
	data.evidencemeta = evidencemeta;

	console.timeEnd("layout load")

	return {
		__db: {
			query(sql, query_name) {
				if (browser) {
					return database_initialization.then(() => query(sql));
				}

				const query_results = query(sql, { route_hash: routeHash, query_name });

				// trigger the prerendering of the cache endpoint
				// should make sure this isn't a race condition
				fetch(`/api/${routeHash}/${query_name}.arrow`);

				return query_results;
			}
		},
		data,
		customFormattingSettings,
		isUserPage
	};
};
