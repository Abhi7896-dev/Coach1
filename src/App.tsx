import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { CategoryStrip } from '@/components/CategoryStrip';
import { ForCoaches } from '@/components/ForCoaches';
import { ForParents } from '@/components/ForParents';
import { Community } from '@/components/Community';
import { Security } from '@/components/Security';
import { AboutUs } from '@/components/AboutUs';
import { CallToAction } from '@/components/CallToAction';
import { Footer } from '@/components/Footer';
import { useReveal } from '@/hooks/useReveal';
import { ReactLenis } from '@studio-freight/react-lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <ReactLenis root options={{ lerp: 0.05, smoothWheel: true }}>
      <div ref={ref} className="min-h-screen bg-white">
        <Navbar />
        <main>
          <Hero />
          <CategoryStrip />
          <ForCoaches />
          <ForParents />
          <Community />
          <AboutUs />
          <Security />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </ReactLenis>
  );
}

export default App;
