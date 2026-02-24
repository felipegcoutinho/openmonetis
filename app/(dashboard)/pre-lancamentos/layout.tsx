import { RiInboxLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Pré-Lançamentos | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 pt-4">
			<PageDescription
				icon={<RiInboxLine />}
				title="Pré-Lançamentos"
				subtitle="Notificações capturadas pelo Companion"
			/>
			{children}
		</section>
	);
}
