import { RiSecurePaymentLine } from "@remixicon/react";
import PageDescription from "@/components/page-description";

export const metadata = {
	title: "Análise de Parcelas | OpenMonetis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6 pt-4">
			<PageDescription
				icon={<RiSecurePaymentLine />}
				title="Análise de Parcelas"
				subtitle="Quanto você gastaria pagando suas despesas parceladas à vista?"
			/>
			{children}
		</section>
	);
}
