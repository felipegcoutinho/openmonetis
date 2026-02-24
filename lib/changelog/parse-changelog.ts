import fs from "node:fs";
import path from "node:path";

export type ChangelogSection = {
	type: string;
	items: string[];
};

export type ChangelogVersion = {
	version: string;
	date: string;
	sections: ChangelogSection[];
	/** Linha de contribuições/autor (pode conter markdown, ex: [Nome](url)) */
	contributor?: string;
};

export function parseChangelog(): ChangelogVersion[] {
	const filePath = path.join(process.cwd(), "CHANGELOG.md");
	const content = fs.readFileSync(filePath, "utf-8");
	const lines = content.split("\n");

	const versions: ChangelogVersion[] = [];
	let currentVersion: ChangelogVersion | null = null;
	let currentSection: ChangelogSection | null = null;

	for (const line of lines) {
		const versionMatch = line.match(/^## \[(.+?)\] - (.+)$/);
		if (versionMatch) {
			if (currentSection && currentVersion) {
				currentVersion.sections.push(currentSection);
			}
			const [y, m, d] = versionMatch[2].split("-");
			currentVersion = {
				version: versionMatch[1],
				date: d && m && y ? `${d}/${m}/${y}` : versionMatch[2],
				sections: [],
			};
			versions.push(currentVersion);
			currentSection = null;
			continue;
		}

		const sectionMatch = line.match(/^### (.+)$/);
		if (sectionMatch && currentVersion) {
			if (currentSection) {
				currentVersion.sections.push(currentSection);
			}
			currentSection = { type: sectionMatch[1], items: [] };
			continue;
		}

		const itemMatch = line.match(/^- (.+)$/);
		if (itemMatch && currentSection) {
			currentSection.items.push(itemMatch[1]);
			continue;
		}

		// **Contribuições:** ou **Autor:** com texto/link opcional
		const contributorMatch = line.match(/^\*\*(?:Contribuições|Autor):\*\*\s*(.+)$/);
		if (contributorMatch && currentVersion) {
			currentVersion.contributor = contributorMatch[1].trim() || undefined;
		}
	}

	if (currentSection && currentVersion) {
		currentVersion.sections.push(currentSection);
	}

	return versions;
}
