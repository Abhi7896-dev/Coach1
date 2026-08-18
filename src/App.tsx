import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { CategoryStrip } from '@/components/CategoryStrip';
import { ForCoaches } from '@/components/ForCoaches';
import { ForParents } from '@/components/ForParents';
import { Community } from '@/components/Community';
import { Security } from '@/components/Security';
import { CallToAction } from '@/components/CallToAction';
import { Footer } from '@/components/Footer';
import { useReveal } from '@/hooks/useReveal';

function App() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <CategoryStrip />
        <ForCoaches />
        <ForParents />
        <Community />
        <Security />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}

export default App;
