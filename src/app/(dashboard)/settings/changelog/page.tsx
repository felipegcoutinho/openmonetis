import { ChangelogTab } from "@/features/settings/components/changelog-tab";
import { parseChangelog } from "@/features/settings/lib/parse-changelog";

export default function ChangelogPage() {
	const versions = parseChangelog();

	return (
		<div className="w-full">
			<ChangelogTab versions={versions} />
		</div>
	);
}
