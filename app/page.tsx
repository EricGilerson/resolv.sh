import Hero from './components/Hero';
import FeatureGrid from './components/FeatureGrid';

export default function Home() {
  return (
    <main className="bg-zinc-950 min-h-screen">
      <Hero />
      <FeatureGrid />
    </main>
  );
}
