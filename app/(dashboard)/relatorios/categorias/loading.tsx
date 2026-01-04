import { CategoryReportSkeleton } from "@/components/skeletons/category-report-skeleton";

export default function Loading() {
  return (
    <main className="flex flex-col gap-6">
      <CategoryReportSkeleton />
    </main>
  );
}
