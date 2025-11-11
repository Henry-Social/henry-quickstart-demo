import HenryWordmark from "@/assets/henry-wordmark";
import React from "react";

const Header = ({ userId }: { userId: string }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <HenryWordmark className="h-8 text-[#44c57e]" />
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs text-gray-500">{userId}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
