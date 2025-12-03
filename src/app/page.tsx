import { CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <h1 className="font-headline text-5xl font-bold tracking-tight text-primary md:text-6xl">
          Waimmo GAS 031225
        </h1>
        <p className="mt-6 text-xl text-muted-foreground">
          Hello World
        </p>
        <div className="mt-8 inline-flex items-center gap-3 rounded-lg bg-accent/20 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
            <CheckCircle className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="text-base font-medium text-accent-foreground">
            Setup is functional
          </span>
        </div>
      </div>
    </main>
  );
}
