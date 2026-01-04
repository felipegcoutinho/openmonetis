import PageDescription from "@/components/page-description";
import { RiFileChartLine } from "@remixicon/react";

export const metadata = {
  title: "Relatórios | Opensheets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6 px-6">
      <PageDescription
        icon={<RiFileChartLine />}
        title="Relatórios de Categorias"
        subtitle="Acompanhe a evolução dos seus gastos e receitas por categoria ao longo do tempo."
      />
      {children}
    </section>
  );
}
