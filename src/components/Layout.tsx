import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 hide-scrollbar">
      <Navbar />
      <main className="flex-grow container mx-auto sm:px-6 lg:px-8 overflow-y-auto hide-scrollbar font-sans">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}