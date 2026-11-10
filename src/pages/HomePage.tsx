import { lazy, Suspense, useRef, useState } from "react";
import { BlackCat } from "@/components/cat/BlackCat";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { books, projects, thoughts, type Project } from "@/data/content";
import { useRevealAnimation } from "@/features/reveal/useRevealAnimation";
import { highlightLayer } from "@/features/system/bus";

const CityScene = lazy(() =>
  import("@/features/city/CityScene").then((module) => ({
    default: module.CityScene,
  })),
);

// 3D パーツは three.js を含むので遅延読み込み（読み込み前・WebGL 非対応時は CSS の表示が残る）
const DeviceShowcase = lazy(() =>
  import("@/features/devices/DeviceShowcase").then((module) => ({
    default: module.DeviceShowcase,
  })),
);
const SystemMap = lazy(() =>
  import("@/features/system/SystemMap").then((module) => ({
    default: module.SystemMap,
  })),
);

const SYSTEM_LAYERS = [
  { id: "L1", name: "INTERFACE", tech: "Swift · SwiftUI · Kotlin" },
  { id: "L2", name: "SERVICE", tech: "Go · REST · GitHub API" },
  { id: "L3", name: "INFRASTRUCTURE", tech: "Cloudflare · VPS · Linux" },
];

function ProjectCard({ project }: { project: Project }) {
  const [card, setCard] = useState<HTMLElement | null>(null);
  return (
    <article
      ref={setCard}
      className={`project-card reveal ${project.className}`}
    >
      <div className="project-top">
        <span>{project.no}</span>
        <span>{project.type}</span>
      </div>
      <div className="project-visual">
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <Suspense fallback={null}>
          <DeviceShowcase devices={project.devices} interactionRoot={card} />
        </Suspense>
        <span className="drag-hint" aria-hidden="true">
          DRAG TO ROTATE ⟲
        </span>
      </div>
      <h3>
        {project.title.split("\n").map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h3>
      <p>{project.copy}</p>
      <div className="project-stack">
        {project.stack} <b>VIEW CASE ↗</b>
      </div>
    </article>
  );
}

export default function HomePage() {
  const experience = useRef<HTMLElement>(null);
  useRevealAnimation(experience);

  return (
    <main id="experience" ref={experience}>
      <Suspense fallback={<div className="city" aria-hidden="true" />}>
        <CityScene />
      </Suspense>
      <div className="page-noise" aria-hidden="true" />
      <SiteHeader />

      <section id="home" className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span>SYS.01</span> INDEPENDENT ENGINEER / TOKYO
            </div>
            <h1>
              CREATE
              <br />
              YOUR OWN
              <br />
              <em>REALITY.</em>
            </h1>
            <p className="jp-copy">技術でまだ見ぬ世界をつくる。</p>
            <div className="hero-bottom">
              <p>
                SOFTWARE ENGINEER
                <br />
                BUILDING BEYOND THE SYSTEM.
              </p>
              <a className="button" href="#work">
                EXPLORE WORK <span>↘</span>
              </a>
            </div>
          </div>
          <BlackCat />
        </div>
        <div className="hero-status">
          <span>LAT 35.6762° N</span>
          <span className="live">SYSTEM ONLINE</span>
          <span>SCROLL TO DESCEND ↓</span>
        </div>
      </section>

      <section id="about" className="section about">
        <SectionLabel detail="PHASE 01 — ORDER">01 / ABOUT</SectionLabel>
        <div className="about-layout reveal">
          <h2>
            I BUILD PRODUCTS
            <br />
            FROM INTERFACE
            <br />
            <em>TO INFRASTRUCTURE.</em>
          </h2>
          <div className="about-copy">
            <p className="lead">
              アイデアを動くプロダクトとして最後まで形にする
            </p>
            <p>
              Swiftを中心としたモバイルアプリ開発に取り組んでいます。UI/UXの設計から、Goによるバックエンド、CloudflareやVPSを活用したインフラ構築まで、プロダクト全体を横断して開発しています。
            </p>
            <p>
              個人開発アプリ「Quoline」をApp
              Storeへリリースしたほか、「BeGit;」ではGitHub
              APIを活用した開発に取り組み、複数のハッカソンで受賞しました。現在は長期インターンで、SwiftとKotlinを用いたモバイル開発にも携わっています。
            </p>
            <p>
              技術を使うこと自体を目的にせず、使う人にとって価値のある体験を、堅実な設計で実現することを大切にしています。
            </p>
            <dl>
              <div>
                <dt>BASE</dt>
                <dd>Tokyo / Remote</dd>
              </div>
              <div>
                <dt>FOCUS</dt>
                <dd>Mobile · Backend · Infrastructure</dd>
              </div>
              <div>
                <dt>STACK</dt>
                <dd>Swift · Go · Kotlin · C</dd>
              </div>
              <div>
                <dt>STATUS</dt>
                <dd>
                  <i /> Building and learning
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section skills">
        <SectionLabel detail="THE TOOL IS NOT THE MISSION">
          02 / CAPABILITIES
        </SectionLabel>
        <div className="skills-layout">
          <aside className="system-map reveal">
            <div className="system-copy">
              <span className="system-kicker">
                <i /> SYSTEM MAP / LIVE
              </span>
              <h3>
                ONE ENGINEER,
                <br />
                <em>EVERY LAYER.</em>
              </h3>
              <p>
                UIからAPI、インフラまで。ひとつのプロダクトを縦に貫いて設計・実装しています。
              </p>
            </div>
            <div className="system-stage">
              <div className="system-fallback" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <Suspense fallback={null}>
                <SystemMap />
              </Suspense>
            </div>
            <ol className="system-legend">
              {SYSTEM_LAYERS.map((layer, index) => (
                <li
                  key={layer.id}
                  tabIndex={0}
                  onMouseEnter={() => highlightLayer(index)}
                  onMouseLeave={() => highlightLayer(null)}
                  onFocus={() => highlightLayer(index)}
                  onBlur={() => highlightLayer(null)}
                >
                  <span>{layer.id}</span>
                  <b>{layer.name}</b>
                  <small>{layer.tech}</small>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section id="work" className="section work">
        <SectionLabel detail="PHASE 02 — INTERFERENCE">
          03 / SELECTED WORK
        </SectionLabel>
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard project={project} key={project.no} />
          ))}
        </div>
        <a className="all-works reveal" href="/works">
          <span>ARCHIVE / 08 PROJECTS · 06 AWARDS</span>
          <strong>
            VIEW ALL WORKS <em>↗</em>
          </strong>
        </a>
      </section>

      <section id="think" className="section philosophy">
        <SectionLabel detail="PHASE 03 — CORRUPTION">
          04 / PHILOSOPHY
        </SectionLabel>
        <div className="quote reveal">
          <span>THESIS / 004</span>
          <blockquote>
            “THE SYSTEM IS
            <br />
            NOT REALITY.
            <br />
            <em>IT IS A CHOICE.</em>”
          </blockquote>
          <p>
            自由意志は制約がないことではない。
            <br />
            どの制約を受け入れるかを自分で決められることだ。
          </p>
        </div>
        <div className="thoughts">
          {thoughts.map((item, index) => (
            <a href="#library" className="reveal" key={item.title}>
              <span>0{index + 1}</span>
              <span className="thought-label">
                <strong>{item.title}</strong>
                <small>{item.translation}</small>
              </span>
              <b>READ NOTE ↗</b>
            </a>
          ))}
        </div>
      </section>

      <section id="library" className="section library">
        <SectionLabel detail="ARCHIVE OF POSSIBLE WORLDS">
          05 / LIBRARY
        </SectionLabel>
        <div className="library-head reveal">
          <h2>
            INPUTS
            <br />
            SHAPE
            <br />
            <em>OUTPUTS.</em>
          </h2>
          <p>
            哲学、SF、コンピュータ科学
            <br />
            現実の解像度を上げるための個人的アーカイブ
          </p>
        </div>
        <div className="book-grid">
          {books.map((book) => (
            <article className="book reveal" key={book.title}>
              <span>{book.no}</span>
              <div className="book-art">
                <img
                  src={book.image}
                  alt={book.alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
            </article>
          ))}
        </div>
      </section>

      <footer id="contact" className="contact">
        <SectionLabel detail="PHASE 04 — RECONSTRUCTION">
          06 / CONTACT
        </SectionLabel>
        <div className="contact-main reveal">
          <p>
            HAVE A WORLD
            <br />
            WORTH BUILDING?
          </p>
          <a href="mailto:auematsu7710@gmail.com">
            LET&apos;S CREATE
            <br />
            <em>REALITY.</em> ↗
          </a>
        </div>
        <div className="footer-row">
          <div>
            <a className="footer-contact" href="mailto:auematsu7710@gmail.com">
              CONTACT ↗
            </a>
            <a
              href="https://github.com/palm7710"
              target="_blank"
              rel="noreferrer"
            >
              GITHUB ↗
            </a>
            <b>LINKEDIN ↗</b>
            <a href="https://x.com/59kja" target="_blank" rel="noreferrer">
              X / TWITTER ↗
            </a>
          </div>
          <span>© 2026 PALM</span>
          <span>REALITY // VERSION 1.0.4</span>
        </div>
      </footer>
    </main>
  );
}
