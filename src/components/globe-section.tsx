"use client";

import dynamic from "next/dynamic";

const RadioGlobe = dynamic(() => import("@/components/radio-globe"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export function GlobeSection() {
  return (
    <div className="fixed inset-0 z-50">
      <RadioGlobe />
    </div>
  );
}
