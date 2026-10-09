import React from "react";
import Navbar from "../components/Navbar";
import ContestRegisterPage from "./ContestPage";

export default function ContestsListPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ContestRegisterPage />
      </main>
    </div>
  );
}
