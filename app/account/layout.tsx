export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#f0f4f8] flex items-center justify-center px-4 py-10 sm:py-16">
      {children}
    </div>
  );
}
