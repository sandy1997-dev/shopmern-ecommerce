import React from "react";

export default function LoadingSpinner({ fullPage = false, size = "md" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };

  const spinner = (
    <div className={`${sizes[size]} border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin`} />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12">
      {spinner}
    </div>
  );
}
