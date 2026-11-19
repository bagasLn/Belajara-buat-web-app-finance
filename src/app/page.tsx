import { Button } from "@/components/ui/button";
import { CoinsIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <CoinsIcon className="text-primary size-20" />
      <h1 className="text-4xl font-bold text-primary">
        Haii, Selamat Datang di financial apps
      </h1>
      <p className="mt-2 text-lg">webapps yang di tenagai oleh AI</p>
      <Link href="/dashboard">
        <Button className="mt-2 size='lg'">
          klik untuk lebih tau keseruanya
        </Button>
      </Link>
    </main>
  );
}
