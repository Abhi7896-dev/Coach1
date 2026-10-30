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
import { BackToTop } from '@/components/BackToTop';
import { FloatingAppWidget } from '@/components/FloatingAppWidget';
import { useReveal } from '@/hooks/useReveal';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Home() {
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
        <AboutUs />
        <Security />
        <CallToAction />
      </main>
      <Footer />
      <BackToTop />
      <FloatingAppWidget />
    </div>
  );
}
