'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import ContactModal from '@/components/ContactModal';
import CaseStudyModal from '@/components/CaseStudyModal';

export default function Home() {
  const starsRef = useRef<HTMLDivElement>(null);
  const nebulaRef = useRef<HTMLDivElement>(null);
  const planetWrapperRef = useRef<HTMLDivElement>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isMagicMarkerCaseStudyOpen, setIsMagicMarkerCaseStudyOpen] = useState(false);
  const [isMightyTeamCaseStudyOpen, setIsMightyTeamCaseStudyOpen] = useState(false);
  const [isFibbingItCaseStudyOpen, setIsFibbingItCaseStudyOpen] = useState(false);
  const [magicMarkerProgress, setMagicMarkerProgress] = useState(0);
  const [isManuallyScrubbing, setIsManuallyScrubbing] = useState(false);
  const isManuallyScrubbingRef = useRef(false);
  const magicMarkerSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      const handleScroll = () => {
        const y = window.scrollY || window.pageYOffset;
        const starsOffset = y * 0.12;
        const nebulaOffset = y * 0.18;
        const planetOffset = y * 0.24;
        const scale = 1 + y * 0.0005;
        const rotate = y * 0.02;

        if (starsRef.current) {
          starsRef.current.style.transform = `translateY(${starsOffset}px)`;
        }
        if (nebulaRef.current) {
          nebulaRef.current.style.transform = `translateY(${nebulaOffset}px)`;
        }
        if (planetWrapperRef.current) {
          planetWrapperRef.current.style.transform =
            `translate3d(0,${planetOffset - window.innerHeight / 2}px,0) scale(${scale}) rotate(${rotate}deg)`;
        }
      };

      handleScroll();
      window.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion && "IntersectionObserver" in window) {
      const sections = document.querySelectorAll("[data-scroll-section]");
      if (sections.length === 0) return;

      const thresholds: number[] = [];
      for (let i = 0; i <= 100; i++) {
        thresholds.push(i / 100);
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.getAttribute('data-scroll-section');
          if (sectionId === 'magic-marker') {
            const ratio = entry.intersectionRatio || 0;
            // Map the intersection ratio to a better progress curve
            // Start animation when element is 10% visible, complete when 90% visible
            // This makes the animation take more scrolling to complete
            let progress = 0;
            if (ratio > 0.1) {
              // Map 0.1-0.9 range to 0-1 progress (100% max)
              // This requires 80% of viewport scroll instead of 60%
              progress = Math.min(1, Math.max(0, (ratio - 0.1) / 0.8));
            }
            // Only update if user isn't manually scrubbing
            if (!isManuallyScrubbingRef.current) {
              setMagicMarkerProgress(progress);
            }
          } else {
            const ratio = entry.intersectionRatio || 0;
            let progress = 0;
            if (ratio > 0.2) {
              progress = Math.min(1, Math.max(0, (ratio - 0.2) / 0.6));
            }
            (entry.target as HTMLElement).style.setProperty("--progress", progress.toFixed(3));
          }
        });
      }, {
        threshold: thresholds,
        rootMargin: '-20% 0px -20% 0px' // Larger margin for slower, smoother animation
      });

      sections.forEach((section) => observer.observe(section));

      return () => {
        sections.forEach((section) => observer.unobserve(section));
      };
    }
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="layer stars" ref={starsRef}></div>
        <div className="layer nebula" ref={nebulaRef}></div>

        <div className="planet-wrapper" ref={planetWrapperRef}>
          <div className="planet">
            <div className="ring"></div>
          </div>
        </div>

        <div className="content">
          <div className="eyebrow">Terrabase2</div>
          <h1>Ricardo Velasco</h1>
          <p className="subtitle">
            Hands-on engineering manager and full-stack builder shipping real-time apps, AI-powered tools and multiplayer experiments end to end.
          </p>
          <div className="cta-row">
            <a href="#magic-marker" className="btn-primary">View Projects</a>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="btn-ghost"
            >
              Contact &amp; Resume
            </button>
          </div>
        </div>

        <div className="scroll-indicator">
          <span>Scroll</span>
          <svg width="18" height="28" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="1" width="14" height="24" rx="7" ry="7" fill="none" stroke="#64748b" strokeWidth="1.5"/>
            <circle cx="12" cy="8" r="2" fill="#64748b"/>
            <path d="M12 29 L7 24 M12 29 L17 24" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="hero-fade"></div>
      </section>

      <main>
        {/* MAGIC MARKER -------------------------------------------------------- */}
        <section 
          className="project-section" 
          id="magic-marker" 
          data-scroll-section="magic-marker"
          ref={magicMarkerSectionRef}
          style={{ '--progress': magicMarkerProgress } as React.CSSProperties}
        >
          <div>
            <div className="project-meta">Project · Magic Marker</div>
            <h2 className="project-title">Magic Marker – From Child&apos;s Drawing to Professional Illustration</h2>
            <p className="project-subtitle">
              An experimental project designed to learn AI integration in web apps. The goal: convert a child&apos;s drawing into a super-powered version that enhances creativity while staying true to the child&apos;s original vision. Users upload a drawing, AI generates questions to disambiguate the concept and capture more creativity, then generates an enhanced professional illustration based on the responses.
            </p>
            <div className="project-tags">
              <span className="tag">React</span>
              <span className="tag">AI Integration</span>
              <span className="tag">UX Prototyping</span>
            </div>
            <div className="project-links">
              <button 
                onClick={() => setIsMagicMarkerCaseStudyOpen(true)}
                className="project-link-button"
              >
                More Info
              </button>
            </div>
          </div>

          <div 
            className={`project-media ${isManuallyScrubbing ? 'manual-scrub' : ''} project-media-clickable`}
            onClick={() => setIsMagicMarkerCaseStudyOpen(true)}
          >
            <div className="project-media-inner">
              <div className="mm-frame">
                <div className="mm-img mm-before">
                  <Image
                    src="/magic-marker/drawing-before.jpg"
                    alt="Original child's drawing"
                    fill
                    className="mm-image"
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                  />
                </div>
                <div className={`mm-img mm-after ${isManuallyScrubbing ? 'no-fade' : ''}`}>
                  <Image
                    src="/magic-marker/drawing-after.png"
                    alt="AI-enhanced illustration"
                    fill
                    className="mm-image"
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                  />
                </div>
                <div className="mm-divider"></div>
                <div className="mm-label left">Before</div>
                <div className="mm-label right">After</div>
              </div>
              <div className="mm-footer" onClick={(e) => e.stopPropagation()}>
                <div className="mm-scrubber-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={magicMarkerProgress}
                    onChange={(e) => {
                      setMagicMarkerProgress(parseFloat(e.target.value));
                      isManuallyScrubbingRef.current = true;
                      setIsManuallyScrubbing(true);
                    }}
                    onMouseUp={() => {
                      isManuallyScrubbingRef.current = false;
                      setIsManuallyScrubbing(false);
                    }}
                    onTouchEnd={() => {
                      isManuallyScrubbingRef.current = false;
                      setIsManuallyScrubbing(false);
                    }}
                    className="mm-scrubber"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="mm-scrubber-labels">
                    <span>Before</span>
                    <span>After</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MIGHTY TEAM DESIGNS ------------------------------------------------- */}
        <section className="project-section" id="mighty-team-designs" data-scroll-section="mighty-team">
          <div>
            <div className="project-meta">Project · Mighty Team Designs</div>
            <h2 className="project-title">Mighty Team Designs – Logos, Jerseys, &amp; Kid-Friendly Brands</h2>
            <p className="project-subtitle">
              A pipeline for turning youth teams into &quot;big club&quot; brands: quick logo generation, jersey mockups,
              and storefront-ready assets parents can order from without friction.
            </p>
            <div className="project-tags">
              <span className="tag">Next.js</span>
              <span className="tag">Design System</span>
              <span className="tag">E‑commerce Ready</span>
              <span className="tag">Brand Generator</span>
            </div>
            <div className="project-links">
              <button 
                className="project-link-button"
                onClick={() => setIsMightyTeamCaseStudyOpen(true)}
              >
                More Info
              </button>
            </div>
          </div>

          <div 
            className="project-media project-media-clickable"
            onClick={() => setIsMightyTeamCaseStudyOpen(true)}
          >
            <div className="project-media-inner mighty-bg">
              <div className="mighty-strip"></div>
              <div style={{position: 'relative'}}>
                <div style={{fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#facc15'}}>
                  Sample Club Identities
                </div>
                <div style={{fontSize: '0.8rem', color: '#e5e7eb', marginTop: '0.2rem'}}>
                  Generated from a single team name &amp; color vibe.
                </div>
                <div className="jersey-row">
                  <div className="jersey">
                    <Image
                      src="/mighty-team-design/KingCobraBold.png"
                      alt="King Cobra Bold"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="jersey">
                    <Image
                      src="/mighty-team-design/KingCobraDynamic.png"
                      alt="King Cobra Dynamic"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="jersey">
                    <Image
                      src="/mighty-team-design/king-cobra.png"
                      alt="King Cobra"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FIBBING IT ------------------------------------------------- */}
        <section className="project-section" id="fibbing-it" data-scroll-section="fibbing-it">
          <div>
            <div className="project-meta">Project · Fibbing It</div>
            <h2 className="project-title">Fibbing It – Trivia Where You Make Up Answers</h2>
            <p className="project-subtitle">
              A multiplayer trivia party game where if you don&apos;t know the answer, you make one up. Players vote on which answer they think is correct, creating hilarious moments when someone&apos;s made-up answer beats the real one. Uses a WebSocket server to keep all clients in sync for real-time gameplay.
            </p>
            <div className="project-tags">
              <span className="tag">Real‑Time</span>
              <span className="tag">WebSockets</span>
              <span className="tag">Party Game</span>
              <span className="tag">Multiplayer</span>
            </div>
            <div className="project-links">
              <button 
                className="project-link-button"
                onClick={() => setIsFibbingItCaseStudyOpen(true)}
              >
                More Info
              </button>
            </div>
          </div>

          <div 
            className="project-media project-media-clickable"
            onClick={() => setIsFibbingItCaseStudyOpen(true)}
          >
            <div className="project-media-inner trivia-bg" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div className="trivia-card">
                <div className="trivia-header">
                  <span>Question 5</span>
                  <span style={{fontSize: '0.65rem', color: '#e5e7eb'}}>Vote Time</span>
                </div>
                <div className="trivia-question">
                  Which mission was the first to successfully land humans on the Moon?
                </div>
                <div className="trivia-answers">
                  <div className="answer">
                    <span>A · Apollo 11</span>
                    <span>Correct ✓</span>
                  </div>
                  <div className="answer">
                    <span>B · The Moon Landing Mission</span>
                    <span>Made up!</span>
                  </div>
                  <div className="answer">
                    <span>C · Space Mission Alpha</span>
                    <span>Creative fib</span>
                  </div>
                  <div className="answer">
                    <span>D · Neil Armstrong&apos;s Trip</span>
                    <span>Another fib</span>
                  </div>
                </div>
                <div className="trivia-footer">
                  <div className="trivia-meter">
                    <div className="trivia-meter-fill"></div>
                  </div>
                  <span>Scroll = crowd hype ↑</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT / CLOSING --------------------------------------------------- */}
        <section className="project-section" id="contact" data-scroll-section="contact">
          <div>
            <div className="project-meta">Contact</div>
            <h2 className="project-title">Let&apos;s build something together</h2>
            <p className="project-subtitle">
              I&apos;m open to engineering manager and senior IC roles, plus select collaborations on real‑time,
              AI‑assisted, or game‑adjacent projects. If your team likes shipping and tinkering in equal measure,
              we&apos;ll probably get along.
            </p>
            <div className="project-tags">
              <span className="tag">Full‑Stack</span>
              <span className="tag">Engineering Leadership</span>
              <span className="tag">Rapid Prototyping</span>
            </div>
            <div className="project-links">
              <a href="mailto:velasco.rico@gmail.com">Email</a>
              <a href="/resume/Ricardo_Velasco_Resume_Senior_FullStack_IC_102025.pdf">Resume</a>
              <a href="https://github.com/generalChaos" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
          <div className="project-media">
            <div className="project-media-inner contact-form-container">
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const name = formData.get('name') as string;
                const email = formData.get('email') as string;
                const message = formData.get('message') as string;
                
                const subject = encodeURIComponent(`Contact request via Terrabase2 from ${name}`);
                const body = encodeURIComponent(
                  `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
                );
                const mailtoLink = `mailto:velasco.rico@gmail.com?subject=${subject}&body=${body}`;
                window.location.href = mailtoLink;
              }} className="contact-form-inline">
                <div className="form-group">
                  <label htmlFor="contact-name">Name</label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    required
                    className="form-input"
                    placeholder="Your name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-email">Email</label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    required
                    className="form-input"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    className="form-textarea"
                    placeholder="Tell me about your project or opportunity..."
                  />
                </div>
                <button
                  type="submit"
                  className="form-submit"
                >
                  Open Email Client
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />

      <CaseStudyModal
        isOpen={isMagicMarkerCaseStudyOpen}
        onClose={() => setIsMagicMarkerCaseStudyOpen(false)}
        project={{
          title: 'Magic Marker',
          tagline: 'AI enhanced line art drawing',
          description: 'An experimental project designed to learn AI integration in web apps. The goal was to convert a child\'s drawing into a super-powered version that enhances creativity while staying true to the child\'s original vision.',
          challenge: 'How do you preserve a child\'s creative intent while using AI to enhance their artwork? The challenge was creating an interactive system that captures the child\'s vision through thoughtful questioning before applying AI enhancement.',
          solution: 'Users upload a drawing, and the AI generates contextual questions to disambiguate the concept and capture more creativity. Based on the responses, the system generates an enhanced professional illustration that maintains the essence of the original artwork.',
          results: 'Successfully created a working prototype that demonstrates AI integration patterns, interactive questioning flows, and image generation workflows. The project served as a valuable learning experience in building AI-powered web applications.',
          technologies: ['React', 'AI Integration', 'Image Processing', 'UX Prototyping', 'Next.js'],
          images: [
            {
              src: '/magic-marker/steps.png',
              alt: 'Process steps',
              caption: 'The enhancement workflow',
              align: 'center',
              position: 'top',
              isHeader: true
            },
            {
              src: '/magic-marker/cropped_drawing.png',
              alt: 'Cropped drawing example',
              caption: 'AI enhanced line art drawing',
              align: 'right',
              position: 'middle'
            }
          ]
        }}
      />

      <CaseStudyModal
        isOpen={isMightyTeamCaseStudyOpen}
        onClose={() => setIsMightyTeamCaseStudyOpen(false)}
        project={{
          title: 'Mighty Team Designs',
          description: 'A comprehensive pipeline for turning youth sports teams into professional-looking brands. The platform enables quick logo generation, jersey mockups, and storefront-ready assets that parents can order seamlessly.',
          challenge: 'Youth sports teams often lack the resources and design expertise to create professional branding. Parents want their kids\' teams to look like "big clubs" but don\'t have the time or budget for custom design work. The challenge was creating an automated system that generates cohesive brand identities quickly and affordably.',
          solution: 'Built a design system that generates complete brand packages from minimal input—team name and color preferences. The system creates logos, jersey designs, and all necessary assets automatically. The platform includes an e-commerce integration so parents can order physical products directly without friction.',
          results: 'Successfully created a working system that can generate professional team identities in minutes. The platform demonstrates how design systems and automation can democratize professional branding for youth sports organizations.',
          technologies: ['Next.js', 'Design System', 'E-commerce Integration', 'Brand Generation', 'Asset Pipeline'],
          images: [
            {
              src: '/mighty-team-design/sample-team-logo.png',
              alt: 'Sample team logo',
              caption: 'Generated team logo example',
              align: 'center',
              position: 'top',
              isHeader: true
            },
            {
              src: '/mighty-team-design/circus-mayhem.png',
              alt: 'Circus Mayhem logo',
              caption: 'Circus Mayhem team identity',
              align: 'right',
              position: 'middle'
            },
            {
              src: '/mighty-team-design/logo-sports-club.png',
              alt: 'Sports club logo',
              caption: 'Sports club branding',
              align: 'left',
              position: 'middle'
            },
            {
              src: '/mighty-team-design/Chivas-logo-3.png',
              alt: 'Chivas inspired logo',
              caption: 'Professional club-inspired design',
              align: 'right',
              position: 'bottom'
            }
          ]
        }}
      />

      <CaseStudyModal
        isOpen={isFibbingItCaseStudyOpen}
        onClose={() => setIsFibbingItCaseStudyOpen(false)}
        project={{
          title: 'Fibbing It',
          description: 'A multiplayer trivia party game where players make up answers if they don\'t know the real one. The twist: everyone votes on which answer they think is correct, leading to hilarious moments when a creative fib beats the actual answer.',
          challenge: 'Creating a real-time multiplayer game that stays in sync across all clients while maintaining low latency for a smooth party game experience. The challenge was building a WebSocket server that could handle multiple game rooms, manage player states, and broadcast updates instantly.',
          solution: 'Built a WebSocket server using Node.js that maintains game state and synchronizes all clients in real-time. Players join game rooms, answer questions (or make up answers), and vote on responses. The server broadcasts all actions immediately, keeping everyone in sync for seamless multiplayer gameplay.',
          results: 'Successfully created a working multiplayer trivia game that demonstrates real-time synchronization, WebSocket communication patterns, and party game mechanics. The game supports multiple concurrent game rooms and provides a fun, engaging experience for groups.',
          technologies: ['WebSockets', 'Real-Time Sync', 'Node.js', 'Multiplayer Game', 'Party Game'],
          images: [
            {
              src: '/trivia-bluff/Trivia-questions.png',
              alt: 'Trivia questions screen',
              caption: 'Players answer questions or make up creative responses',
              align: 'left',
              position: 'top'
            },
            {
              src: '/trivia-bluff/Trivia-points.png',
              alt: 'Points and scoring',
              caption: 'Real-time scoring and points tracking',
              align: 'right',
              position: 'middle'
            }
          ]
        }}
      />
    </>
  );
}
