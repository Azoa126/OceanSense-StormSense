import dynamic from "next/dynamic";
const Neritic_v2 = dynamic(() => import("../components/Neritic_v2"), { ssr: false });

export default function Home() {
  return (
    <main>
      <h1 className="text-3xl font-bold text-center mt-6">OceanSense 🌊</h1>
      <Neritic_v2 />
    </main>
  );
}
