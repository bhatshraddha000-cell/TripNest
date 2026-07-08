import { useState } from 'react'
import Navbar from '../components/landing/Navbar.jsx'
import HeroSection from '../components/landing/HeroSection.jsx'
import StorySection from '../components/landing/StorySection.jsx'
import DestinationsSection from '../components/landing/DestinationsSection.jsx'
import FeaturesSection from '../components/landing/FeaturesSection.jsx'
import HowItWorks from '../components/landing/HowItWorks.jsx'
import TravelGallery from '../components/landing/TravelGallery.jsx'
import Testimonials from '../components/landing/Testimonials.jsx'
import StatsSection from '../components/landing/StatsSection.jsx'
import CTASection from '../components/landing/CTASection.jsx'
import Footer from '../components/landing/Footer.jsx'
import SectionReveal from '../components/landing/SectionReveal.jsx'

function LandingPage() {
  const [searchValue, setSearchValue] = useState('')

  return (
    <div className="landing-page">
      <Navbar searchValue={searchValue} onSearchChange={setSearchValue} />
      <main>
        <HeroSection />
        <StorySection />
        <SectionReveal>
          <DestinationsSection searchValue={searchValue} />
        </SectionReveal>
        <SectionReveal direction="left">
          <FeaturesSection />
        </SectionReveal>
        <SectionReveal direction="right">
          <HowItWorks />
        </SectionReveal>
        <SectionReveal>
          <TravelGallery />
        </SectionReveal>
        <SectionReveal>
          <Testimonials />
        </SectionReveal>
        <SectionReveal>
          <StatsSection />
        </SectionReveal>
        <SectionReveal>
          <CTASection />
        </SectionReveal>
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
