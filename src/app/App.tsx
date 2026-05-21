import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return (
    <div className="bg-black min-h-screen w-full flex items-center justify-center sm:p-8 font-sans antialiased text-white">
      <div className="w-full h-full sm:w-[393px] sm:h-[852px] bg-[#0F172A] sm:rounded-[55px] sm:border-[14px] border-slate-900 overflow-hidden relative shadow-2xl flex flex-col">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#7C3AED] z-0 opacity-90 pointer-events-none" />
        
        {/* Decorative blobs */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-[#4F8CFF] rounded-full mix-blend-screen filter blur-[80px] opacity-25 z-0 pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-[#7C3AED] rounded-full mix-blend-screen filter blur-[80px] opacity-25 z-0 pointer-events-none" />
        
        <div className="relative z-10 w-full h-full flex flex-col">
          <RouterProvider router={router} />
        </div>
      </div>
    </div>
  );
}
