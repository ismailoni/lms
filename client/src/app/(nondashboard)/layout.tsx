import NonDashboardNavbar from "@/components/NonDashboardNavbar";
import Footer from "@/components/Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nondashboard-layout">
      <NonDashboardNavbar />
      <main className="nondashboard-layout__main flex-grow min-h-screen">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
