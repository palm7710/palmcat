import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  archiveWorks,
  awards,
  career,
  credentials,
  featuredWorks,
  type FeaturedWork,
} from "@/data/works";
import { useRevealAnimation } from "@/features/reveal/useRevealAnimation";
import { TiltCard } from "@/features/tilt/TiltCard";

const CityScene = lazy(() =>
  import("@/features/city/CityScene").then((module) => ({
    default: module.CityScene,
  })),
);
const DeviceShowcase = lazy(() =>
  import("@/features/devices/DeviceShowcase").then((module) => ({
    default: module.DeviceShowcase,
  })),
);

const pad = (value: number) => String(value).padStart(2, "0");
const projectCount = featuredWorks.length + archiveWorks.length;
const prizeCount = awards.reduce(
  (total, award) => total + award.prize.split("/").length,
  0,
);
const internshipCount = career.filter((item) => item.type === "work").length;

function FeaturedRow({ work, index }: { work: FeaturedWork; index: number }) {
  const [row, setRow] = useState<HTMLElement | null>(null);
  return (
    <article
      ref={setRow}
      className={`featured-work reveal ${index % 2 ? "is-reversed" : ""}`}
      id={work.slug}
    >
      <div className="project-visual featured-stage">
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <Suspense fallback={null}>
          <DeviceShowcase devices={work.devices} interactionRoot={row} />
        </Suspense>
        <span className="drag-hint" aria-hidden="true">
          DRAG TO ROTATE ⟲
        </span>
        {work.award && <b className="award-stamp">★ {work.award}</b>}
      </div>
      <div className="featured-copy">
        <div className="featured-meta">
          <span>[{work.no}]</span>
          <span>{work.kind}</span>
          <time>{work.period}</time>
        </div>
        <h2>{work.title}</h2>
        {work.tagline && <p className="featured-tagline">{work.tagline}</p>}
        <p className="featured-summary">{work.summary}</p>
        {work.features && (
          <ul className="featured-features">
            {work.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}
        <div className="featured-stack">
          {work.stack.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
        {work.links.length > 0 && (
          <div className="featured-links">
            {work.links.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label} <span>↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function WorksPage() {
  const experience = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<"ALL" | "AWARDED">("ALL");
  useRevealAnimation(experience);

  const visibleArchive =
    filter === "ALL" ? archiveWorks : archiveWorks.filter((work) => work.award);

  useEffect(() => {
    document.title = "WORKS / PALM";
    return () => {
      document.title = "PALM — Create Your Own Reality";
    };
  }, []);

  return (
    <main id="experience" ref={experience} className="works-page">
      <Suspense fallback={<div className="city" aria-hidden="true" />}>
        <CityScene />
      </Suspense>
      <div className="page-noise" aria-hidden="true" />
      <SiteHeader page="works" />

      <section className="works-hero">
        <div className="eyebrow">
          <span>ARCHIVE.02</span> WORKS / 2022 — 2026
        </div>
        <h1>
          BUILT,
          <br />
          NOT
          <br />
          <em>IMAGINED.</em>
        </h1>
        <div className="works-hero-bottom">
          <p className="jp-copy">
            アイデアを、動くプロダクトとして最後まで。
            <br />
            個人開発、ハッカソン、長期インターンでつくってきたものの記録です。
          </p>
          <dl className="works-stats">
            <div>
              <dt>PROJECTS</dt>
              <dd>{pad(projectCount)}</dd>
            </div>
            <div>
              <dt>AWARDS</dt>
              <dd>{pad(prizeCount)}</dd>
            </div>
            <div>
              <dt>INTERNSHIPS</dt>
              <dd>{pad(internshipCount)}</dd>
            </div>
          </dl>
        </div>
        <div className="hero-status">
          <span>SOURCE: WANTEDLY / APP STORE</span>
          <span className="live">OPEN FOR SIDE PROJECTS — 2027.04</span>
          <span>SCROLL TO DESCEND ↓</span>
        </div>
      </section>

      <section className="section works-featured">
        <SectionLabel detail="SHIPPED & AWARDED">01 / FEATURED</SectionLabel>
        {featuredWorks.map((work, index) => (
          <FeaturedRow work={work} index={index} key={work.slug} />
        ))}
      </section>

      <section className="section works-archive">
        <SectionLabel detail="TEAM BUILDS / AWARDS">
          02 / HACKATHON ARCHIVE
        </SectionLabel>
        <div className="archive-head works-archive-head">
          <div>
            <span>ALL BUILDS</span>
            <strong>{pad(visibleArchive.length)}</strong>
          </div>
          <div className="filters" aria-label="作品の絞り込み">
            {(["ALL", "AWARDED"] as const).map((value) => (
              <button
                type="button"
                className={filter === value ? "selected" : ""}
                onClick={() => setFilter(value)}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="works-list">
          {visibleArchive.map((work) => (
            <article className="works-row" key={work.no}>
              <span className="works-row-no">{work.no}</span>
              <time className="works-row-date">{work.period}</time>
              <div className="works-row-copy">
                <small>{work.event}</small>
                <h3>{work.title}</h3>
                {work.summary && <p>{work.summary}</p>}
                {work.stack && (
                  <div className="featured-stack">
                    {work.stack.map((tech) => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="works-row-award">
                {work.award ? <b>★ {work.award}</b> : <span>ENTRY</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section works-awards">
        <SectionLabel detail="RECOGNITION LOG">03 / AWARDS</SectionLabel>
        <div className="award-grid">
          {awards.map((award) => (
            <TiltCard className="reveal" key={award.title}>
              <div className="award-card">
                <span>{award.date}</span>
                <b aria-hidden="true">★</b>
                <strong>{award.prize}</strong>
                <p>{award.title}</p>
              </div>
            </TiltCard>
          ))}
        </div>
        <div className="credentials reveal">
          {credentials.map((item) => (
            <div key={`${item.title}-${item.date}`}>
              <span>{item.date}</span>
              <strong>{item.title}</strong>
              <small>{item.prize}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="section works-career">
        <SectionLabel detail="WORK & STUDY">04 / CAREER LOG</SectionLabel>
        <ol className="career-list">
          {career.map((item) => (
            <li className={`career-item reveal is-${item.type}`} key={item.org}>
              <time>{item.period}</time>
              <i aria-hidden="true" />
              <div>
                <small>
                  {item.type === "work" ? "WORK" : "STUDY"} / {item.role}
                </small>
                <h3>{item.org}</h3>
                <p>{item.summary}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer id="contact" className="contact">
        <SectionLabel detail="PHASE 04 — RECONSTRUCTION">05 / CONTACT</SectionLabel>
        <div className="contact-main reveal">
          <p>
            OPEN FOR SIDE PROJECTS
            <br />
            FROM 2027.04 — MOBILE / BACKEND
          </p>
          <a href="mailto:auematsu7710@gmail.com">
            LET&apos;S BUILD
            <br />
            <em>TOGETHER.</em> ↗
          </a>
        </div>
        <div className="footer-row">
          <div>
            <a className="footer-contact" href="mailto:auematsu7710@gmail.com">
              CONTACT ↗
            </a>
            <a href="https://www.wantedly.com/id/ayaka_uematsu8" target="_blank" rel="noreferrer">
              WANTEDLY ↗
            </a>
            <a href="https://github.com/palm7710" target="_blank" rel="noreferrer">
              GITHUB ↗
            </a>
            <a href="https://x.com/59kja" target="_blank" rel="noreferrer">
              X / TWITTER ↗
            </a>
          </div>
          <span>© 2026 PALM</span>
          <a href="/">← BACK TO HOME</a>
        </div>
      </footer>
    </main>
  );
}
