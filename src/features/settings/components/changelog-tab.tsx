import Link from "next/link";
import type { ChangelogVersion } from "@/features/settings/lib/parse-changelog";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";

/** Converte "[texto](url)" em link; texto simples fica como está */
function parseContributorLine(content: string) {
	const linkMatch = content.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
	if (linkMatch) {
		return { label: linkMatch[1], url: linkMatch[2] };
	}
	return { label: content, url: null };
}

const sectionBadgeVariant: Record<
	string,
	"success" | "info" | "destructive" | "secondary" | "outline"
> = {
	Adicionado: "success",
	Alterado: "info",
	Corrigido: "outline",
	Removido: "destructive",
};

function getSectionVariant(type: string) {
	return sectionBadgeVariant[type] ?? "secondary";
}

export function ChangelogTab({ versions }: { versions: ChangelogVersion[] }) {
	return (
		<div className="space-y-4">
			{versions.map((version) => (
				<Card key={version.version} className="p-6">
					<div className="flex items-baseline gap-3">
						<h3 className="text-lg font-semibold">v{version.version}</h3>
						<span className="text-sm text-muted-foreground">
							{version.date}
						</span>
					</div>
					<div className="space-y-4 w-full mx-auto sm:w-3/4">
						{version.sections.map((section) => (
							<div key={section.type}>
								<Badge
									variant={getSectionVariant(section.type)}
									className="mb-2"
								>
									{section.type}
								</Badge>
								<ul className="space-y-2 text-muted-foreground leading-relaxed text-pretty">
									{section.items.map((item) => (
										<li key={item} className="flex gap-2">
											<span className="text-primary">&bull;</span>
											<span className="text-sm">{item}</span>
										</li>
									))}
								</ul>
							</div>
						))}
						{version.contributor && (
							<div className="border-t pt-4 mt-4">
								<span className="text-sm text-muted-foreground">
									Contribuições: {(() => {
										const { label, url } = parseContributorLine(
											version.contributor,
										);
										if (url) {
											return (
												<Link
													href={url}
													target="_blank"
													rel="noopener noreferrer"
													className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
												>
													{label}
												</Link>
											);
										}
										return (
											<span className="font-medium text-foreground">
												{label}
											</span>
										);
									})()}
								</span>
							</div>
						)}
					</div>
				</Card>
			))}
		</div>
	);
}
