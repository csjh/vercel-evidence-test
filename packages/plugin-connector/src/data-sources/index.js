import { getSources, getSourcesDir } from './get-sources';
import { getDatasourcePlugins } from './get-datasource-plugins';
import { execSource } from './exec-source';
import fs from 'fs/promises';
import path from 'path';

/**
 * @param {string} outDir
 * @param {string} [prefix]
 */
export async function updateDatasourceOutputs(outDir, prefix) {
	const datasourceDir = await getSourcesDir();
	if (!datasourceDir) throw new Error('missing sources directory');
	const datasources = await getSources(datasourceDir);
	const plugins = await getDatasourcePlugins();
	// TODO: Run in parallel?
	/** @type {Record<string, string[]>} */
	const outputFiles = {};
	for (const source of datasources) {
		outputFiles[source.name] = [];
		const newFiles = await execSource(source, plugins, outDir);
		if (prefix) {
			outputFiles[source.name].push(...newFiles.map((nf) => `${prefix}${nf}`));
		} else {
			outputFiles[source.name].push(...newFiles);
		}
	}
	// Write basic JSON Manifest
	await fs.mkdir(outDir, { recursive: true });
	await fs.writeFile(
		path.join(outDir, 'manifest.json'),
		JSON.stringify({ renderedFiles: outputFiles })
	);
}
