import Providers from './components/providers';
import {DesktopNav} from "./components/desktop-nav";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function DashboardLayout({children}: { children: React.ReactNode }) {
  return (
    <Providers>
      <main className="flex min-h-screen w-full flex-col bg-muted/40">
        <DesktopNav/>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          {children}
        </div>
      </main>
      <ToastContainer />
    </Providers>
  );
}
