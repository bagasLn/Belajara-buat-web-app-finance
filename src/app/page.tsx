import { Button } from "@/components/ui/button";
import { CoinsIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <CoinsIcon className="text-primary size-20" />
      <h1 className="text-primary text-4xl font-bold">teks 1</h1>
      <p className="mt-2 text-lg">teks 2</p>
      <Link href="/dashboard">
        <Button className="mt-2 size='lg'">click to awesome</Button>
      </Link>
    </main>
  );
}
