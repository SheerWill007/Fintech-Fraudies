import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:ml-[248px]">
        <Header />
        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-[18px] px-4 pb-10 pt-7 md:px-7">{children}</main>
      </div>
    </div>
  );
}
