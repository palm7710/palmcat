import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { categories, posts } from "@/data/content";

export default function BlogPage() {
  const [filter, setFilter] = useState<(typeof categories)[number]>("ALL");
  const visiblePosts =
    filter === "ALL" ? posts : posts.filter((post) => post.category === filter);
  const latestPost = posts[0];

  useEffect(() => {
    document.title = "THINK / PALM";
    return () => {
      document.title = "PALM — Create Your Own Reality";
    };
  }, []);

  return (
    <main className="blog-page">
      <div className="page-noise" aria-hidden="true" />
      <SiteHeader page="blog" />

      <section className="archive">
        <div className="archive-visual">
          <img
            src="/images/blog/cat-butterfly.jpg"
            alt="蝶を鼻に乗せた黒猫"
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <div className="archive-head">
          <div>
            <span>ALL TRANSMISSIONS</span>
            <strong>{String(visiblePosts.length).padStart(2, "0")}</strong>
          </div>
          <div className="filters" aria-label="記事カテゴリ">
            {categories.map((category) => (
              <button
                type="button"
                className={filter === category ? "selected" : ""}
                onClick={() => setFilter(category)}
                key={category}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="post-list">
          {visiblePosts.map((post) => (
            <article className="post-row" id={`post-${post.no}`} key={post.no}>
              <div className="post-index">[{post.no}]</div>
              <div className="post-date">
                <span>{post.category}</span>
                <time dateTime={post.date.replace(/\./g, "-")}>
                  {post.date}
                </time>
              </div>
              <div className="post-copy">
                <h2>
                  <Link to={`/blog/${post.no}`}>{post.title}</Link>
                </h2>
                <h3>{post.titleEn}</h3>
                <p>{post.summary}</p>
              </div>
              <div className="post-action">
                <span>{post.time} READ</span>
                <Link to={`/blog/${post.no}`} aria-label={`${post.title}を読む`}>
                  ↗
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="blog-manifesto">
        <p>
          THE PURPOSE OF WRITING
          <br />
          IS NOT TO PRESERVE AN ANSWER.
        </p>
        <h2>
          IT IS TO LEAVE
          <br />A BETTER <em>QUESTION.</em>
        </h2>
        <span>— PALM / NOTE 000</span>
      </section>

      <footer className="blog-footer">
        <a href="/">← RETURN TO BASE REALITY</a>
        <span>© 2026 PALM</span>
        <span>THINK ARCHIVE // {latestPost.no}</span>
      </footer>
    </main>
  );
}
