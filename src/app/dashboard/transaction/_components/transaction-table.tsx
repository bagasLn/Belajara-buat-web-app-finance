import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTransactions } from "@/features/transaction/action";
import { cn, convertToIDR } from "@/lib/utils";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Fragment } from "react/jsx-runtime";

const Table_Header = [
  "#",
  "Date",
  "Description",
  "Category",
  "Amount",
  "Action",
];

export default function TranscationTable({
  transactions,
  isLoading,
  refetch,
  page,
  limit,
  search,
  setPage,
  setLimit,
  setSearch,
}: {
  transactions?: Awaited<ReturnType<typeof getTransactions>>;
  page: number;
  limit: number;
  search: string;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  isLoading: boolean;
  refetch: () => void;
}) {
  const [localSerach, setLocalSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSerach !== search) {
        setSearch(localSerach);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  });

  return (
    <Fragment>
      <Card className="w-full gap-2">
        <CardHeader className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div>
            <CardTitle>Recent Transaction</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </div>
          <div>
            <Input
              placeholder="search..."
              value={localSerach}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {Table_Header.map((header) => (
                  <TableHead key={`th-${header}`}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading &&
                transactions?.data?.map((transaction, index) => (
                  <TableRow key={`tr-${transaction.id}`}>
                    <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell
                      className={cn(
                        "font-semibold",
                        transaction.type === "expense"
                          ? "text-destructive"
                          : "text-green-400",
                      )}
                    >
                      {transaction.type === "expense" && "- "}
                      {convertToIDR(transaction.amount)}
                    </TableCell>
                    <TableCell className="flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-yellow-500"
                        onClick={() => {}}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {}}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
            {isLoading && (
              <TableCaption className="mb-4">Waiting....</TableCaption>
            )}
            {!isLoading && transactions?.data?.length === 0 && (
              <TableCaption className="mb-4">
                transaction not found !!
              </TableCaption>
            )}
          </Table>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <div className="text text-sm text-muted-foreground">
                {" "}
                Rows per page
              </div>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder={limit.toString()} />
                  <SelectContent>
                    {[1, 10, 20, 50, 100].map((size) => (
                      <SelectItem key={`limit-${size}`} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectTrigger>
              </Select>
            </div>
            {transactions?.totalPages && transactions?.totalPages > 1 ? (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        page === 1
                          ? setPage(Number(transactions?.totalPages))
                          : setPage(page - 1)
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        page === Number(transactions?.totalPages)
                          ? setPage(1)
                          : setPage(page + 1)
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : (
              ""
            )}
          </div>
        </CardContent>
      </Card>
    </Fragment>
  );
}
