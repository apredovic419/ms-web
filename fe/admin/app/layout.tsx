import './globals.css';
import 'react-day-picker/dist/style.css';
import {ToastContainer} from 'react-toastify';


export const metadata = {
  title: 'MagicMS Admin',
  description: '',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  }
};

export default function RootLayout({
                                     children
                                   }: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
    <body className="flex min-h-screen w-full flex-col">
    {children}
    <ToastContainer/>
    </body>
    {/*<Analytics />*/}
    </html>
  );
}
