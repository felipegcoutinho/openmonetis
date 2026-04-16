import { RiAttachmentLine } from "@remixicon/react";
import MonthNavigation from "@/shared/components/month-picker/month-navigation";
import PageDescription from "@/shared/components/page-description";

export const metadata = {
	title: "Anexos",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6">
			<PageDescription
				icon={<RiAttachmentLine />}
				title="Anexos"
				subtitle="Gerencie os anexos das suas transações"
			/>
			<MonthNavigation />

			{children}
		</section>
	);
}
