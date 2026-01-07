import Header from './components/Header';
import Hero from './components/Hero';
import FeatureGrid from './components/FeatureGrid';
import SdlcSection from './components/SdlcSection';

export default function Home() {
  return (
    <main className="bg-zinc-950 min-h-screen">
      <Header />
      <Hero />
      <SdlcSection />
      <FeatureGrid />
    </main>
  );
}
