import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/**
 * Skeleton para a página de relatórios de categorias
 * Mantém a mesma estrutura de filtros, tabs e conteúdo
 */
export function CategoryReportSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Filters Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category MultiSelect */}
            <Skeleton className="h-10 w-[200px] rounded-2xl bg-foreground/10" />
            {/* Start Period */}
            <Skeleton className="h-10 w-[150px] rounded-2xl bg-foreground/10" />
            {/* End Period */}
            <Skeleton className="h-10 w-[150px] rounded-2xl bg-foreground/10" />
            {/* Clear Button */}
            <Skeleton className="h-8 w-16 rounded-2xl bg-foreground/10" />
          </div>
          {/* Export Button */}
          <Skeleton className="h-10 w-[120px] rounded-2xl bg-foreground/10" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <Tabs value="table" className="w-full">
        <TabsList>
          <div className="flex gap-1">
            <Skeleton className="h-10 w-[100px] rounded-2xl bg-foreground/10" />
            <Skeleton className="h-10 w-[100px] rounded-2xl bg-foreground/10" />
          </div>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          {/* Desktop Table Skeleton */}
          <div className="hidden md:block">
            <CategoryReportTableSkeleton />
          </div>

          {/* Mobile Cards Skeleton */}
          <div className="md:hidden space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  {/* Category name with icon */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded-2xl bg-foreground/10" />
                    <Skeleton className="h-5 w-32 rounded-2xl bg-foreground/10" />
                  </div>
                  {/* Type badge */}
                  <Skeleton className="h-6 w-20 rounded-2xl bg-foreground/10" />
                  {/* Values */}
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between"
                      >
                        <Skeleton className="h-4 w-24 rounded-2xl bg-foreground/10" />
                        <Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          {/* Chart Skeleton */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Chart title area */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48 rounded-2xl bg-foreground/10" />
                <Skeleton className="h-8 w-32 rounded-2xl bg-foreground/10" />
              </div>
              {/* Chart area */}
              <Skeleton className="h-[400px] w-full rounded-2xl bg-foreground/10" />
              {/* Legend */}
              <div className="flex flex-wrap gap-4 justify-center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="size-3 rounded-full bg-foreground/10" />
                    <Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Skeleton para a tabela de relatórios de categorias
 * Mantém a estrutura de colunas: Categoria, Tipo, múltiplos períodos, Total
 */
function CategoryReportTableSkeleton() {
  // Simula 6 períodos (colunas)
  const periodColumns = 6;

  return (
    <Card className="px-6 py-4">
      <Table>
        <TableHeader>
          <TableRow>
            {/* Categoria */}
            <TableHead className="w-[280px] min-w-[280px]">
              <Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
            </TableHead>
            {/* Period columns */}
            {Array.from({ length: periodColumns }).map((_, i) => (
              <TableHead key={i} className="text-right min-w-[120px]">
                <Skeleton className="h-4 w-16 rounded-2xl bg-foreground/10 ml-auto" />
              </TableHead>
            ))}
            {/* Total */}
            <TableHead className="text-right min-w-[120px]">
              <Skeleton className="h-4 w-10 rounded-2xl bg-foreground/10 ml-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {/* Category name with dot and icon */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-2 rounded-full bg-foreground/10" />
                  <Skeleton className="size-4 rounded-2xl bg-foreground/10" />
                  <Skeleton className="h-4 w-32 rounded-2xl bg-foreground/10" />
                </div>
              </TableCell>
              {/* Period values */}
              {Array.from({ length: periodColumns }).map((_, colIndex) => (
                <TableCell key={colIndex} className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton className="h-4 w-20 rounded-2xl bg-foreground/10" />
                    {colIndex > 0 && (
                      <Skeleton className="h-3 w-16 rounded-2xl bg-foreground/10" />
                    )}
                  </div>
                </TableCell>
              ))}
              {/* Total */}
              <TableCell className="text-right">
                <Skeleton className="h-4 w-24 rounded-2xl bg-foreground/10" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            {/* Total label */}
            <TableCell className="font-bold">
              <Skeleton className="h-5 w-16 rounded-2xl bg-foreground/10" />
            </TableCell>
            {/* Period totals */}
            {Array.from({ length: periodColumns }).map((_, i) => (
              <TableCell key={i} className="text-right">
                <Skeleton className="h-5 w-24 rounded-2xl bg-foreground/10 ml-auto" />
              </TableCell>
            ))}
            {/* Grand total */}
            <TableCell className="text-right">
              <Skeleton className="h-5 w-28 rounded-2xl bg-foreground/10 ml-auto" />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  );
}
