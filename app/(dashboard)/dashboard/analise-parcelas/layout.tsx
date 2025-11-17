import PageDescription from "@/components/page-description";
import { RiSecurePaymentLine } from "@remixicon/react";

export const metadata = {
  title: "Análise de Parcelas | OpenSheets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6 px-6">
      <PageDescription
        icon={<RiSecurePaymentLine />}
        title="Análise de Parcelas"
        subtitle="Quanto você gastaria pagando suas despesas parceladas à vista?"
      />
      {children}
    </section>
  );
}
