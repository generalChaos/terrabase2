'use client';

import { useEffect, useRef } from 'react';

export default function Home() {
  const starsRef = useRef<HTMLDivElement>(null);
  const nebulaRef = useRef<HTMLDivElement>(null);
  const planetWrapperRef = useRef<HTMLDivElement>(null);

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
          const ratio = entry.intersectionRatio || 0;
          (entry.target as HTMLElement).style.setProperty("--progress", ratio.toFixed(3));
        });
      }, {
        threshold: thresholds
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
            Engineering manager &amp; full-stack builder crafting real-time apps,
            AI-powered tools, and multiplayer experiments—anchored around three flagship projects.
          </p>
          <div className="cta-row">
            <a href="#magic-marker" className="btn-primary">View Projects</a>
            <a href="#contact" className="btn-ghost">Contact &amp; Resume</a>
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
        <section className="project-section" id="magic-marker" data-scroll-section="magic-marker">
          <div>
            <div className="project-meta">Project · Magic Marker</div>
            <h2 className="project-title">Magic Marker – Scroll-Revealed Before &amp; After</h2>
            <p className="project-subtitle">
              An AI-powered image tool where you highlight regions, describe a change, and watch the result land in context.
              Here, the scroll simulates that transformation: as you move, the &quot;after&quot; state reveals itself.
            </p>
            <div className="project-tags">
              <span className="tag">React</span>
              <span className="tag">Canvas</span>
              <span className="tag">AI Integration</span>
              <span className="tag">UX Prototyping</span>
            </div>
            <div className="project-links">
              <a href="#">Live demo (placeholder)</a>
              <a href="#">View code (placeholder)</a>
            </div>
          </div>

          <div className="project-media">
            <div className="project-media-inner">
              <div className="mm-frame">
                <div className="mm-img mm-before">
                  Original Artwork
                </div>
                <div className="mm-img mm-after">
                  AI-Enhanced Version
                </div>
                <div className="mm-divider"></div>
                <div className="mm-label left">Before</div>
                <div className="mm-label right">After</div>
              </div>
              <div className="mm-footer">
                <div className="mm-steps">
                  <div className="mm-step">Highlight</div>
                  <div className="mm-step">Prompt</div>
                  <div className="mm-step">Transform</div>
                </div>
                <span>Scroll to reveal the upgrade →</span>
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
              <a href="#">Concept walkthrough (placeholder)</a>
              <a href="#">Design tokens (placeholder)</a>
            </div>
            <p className="mighty-footnote">
              As you scroll through this section, the strip and jerseys stagger into view—mirroring how teams
              progress from sketch to fully kitted-out identity.
            </p>
          </div>

          <div className="project-media">
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
                  <div className="jersey">Blue Vipers</div>
                  <div className="jersey">King Cobras</div>
                  <div className="jersey">Purple Shark Ninjas</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OUT TRIVIA PARTY GAME ---------------------------------------------- */}
        <section className="project-section" id="out-trivia-party-game" data-scroll-section="trivia-party">
          <div>
            <div className="project-meta">Project · Out Trivia Party Game</div>
            <h2 className="project-title">Out Trivia – Fast-Paced, Multiplayer Party Trivia</h2>
            <p className="project-subtitle">
              A browser-based trivia party game built for living rooms and voice chat: quick rounds, streak bonuses,
              and just enough chaos that someone always gets robbed on the last question.
            </p>
            <div className="project-tags">
              <span className="tag">Real‑Time</span>
              <span className="tag">WebSockets</span>
              <span className="tag">Party Game</span>
              <span className="tag">Score Streaks</span>
            </div>
            <div className="project-links">
              <a href="#">Gameplay mock (placeholder)</a>
              <a href="#">Architecture notes (placeholder)</a>
            </div>
          </div>

          <div className="project-media">
            <div className="project-media-inner trivia-bg" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div className="trivia-card">
                <div className="trivia-header">
                  <span>Final Question</span>
                  <span style={{fontSize: '0.65rem', color: '#e5e7eb'}}>x3 multiplier</span>
                </div>
                <div className="trivia-question">
                  Which mission was the first to successfully land humans on the Moon?
                </div>
                <div className="trivia-answers">
                  <div className="answer">
                    <span>A · Apollo 8</span>
                    <span>Nice try</span>
                  </div>
                  <div className="answer">
                    <span>B · Apollo 11</span>
                    <span>Correct</span>
                  </div>
                  <div className="answer">
                    <span>C · Apollo 13</span>
                    <span>Not that one</span>
                  </div>
                  <div className="answer">
                    <span>D · Gemini 4</span>
                    <span>Bold choice</span>
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
              <a href="#">GitHub (placeholder)</a>
            </div>
          </div>
          <div className="project-media">
            <div className="project-media-inner" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
              <div>
                <div style={{fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: '#7dd3fc', marginBottom: '0.4rem'}}>
                  Terrabase2
                </div>
                <div style={{fontSize: '1rem', marginBottom: '0.4rem'}}>
                  Portfolio · Playground · Launchpad
                </div>
                <div style={{fontSize: '0.85rem', color: '#cbd5f5'}}>
                  Swap this box for a real contact form, or a small &quot;now&quot; section that shares what you&apos;re
                  currently experimenting with.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
