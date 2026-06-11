import { LoginForm } from "./_components/login-form";
import { LoginHeroSection } from "./_components/login-hero-section";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center px-6 py-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border lg:grid-cols-[1fr_0.9fr]">
        <LoginHeroSection />
        <LoginForm />
      </div>
    </main>
  );
}
