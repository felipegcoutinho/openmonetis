import { ChangelogTab } from "@/components/ajustes/changelog-tab";
import { parseChangelog } from "@/lib/changelog/parse-changelog";

export default function ChangelogPage() {
	const versions = parseChangelog();

	return (
		<div className="w-full">
			<ChangelogTab versions={versions} />
		</div>
	);
}
