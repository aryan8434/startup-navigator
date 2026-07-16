"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Calendar, Tag, ChevronRight, HelpCircle } from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export default function ArticleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      try {
        const res = await fetch(`/api/articles/${id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data.article);
          
          // Fetch related articles in same category
          const articlesRes = await fetch(`/api/articles?category=${encodeURIComponent(data.article.category)}`);
          if (articlesRes.ok) {
            const articlesData = await articlesRes.json();
            setRelated(
              articlesData.articles
                .filter((a: Article) => a.id !== id)
                .slice(0, 3)
            );
          }
        }
      } catch (error) {
        console.error("Failed to load article detail:", error);
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [id]);

  // A simple, bulletproof Markdown-to-HTML parser for rendering the seed article content
  const renderContent = (text: string) => {
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();

      // Heading 3
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xl font-display font-semibold text-white mt-8 mb-4">
            {trimmed.substring(4)}
          </h3>
        );
      }

      // Heading 2
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-2xl font-display font-bold text-white mt-10 mb-5 border-b border-slate-900 pb-2">
            {trimmed.substring(3)}
          </h2>
        );
      }

      // Bullet Lists
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        // Simple bold parsing within list item
        const listText = trimmed.substring(2);
        return (
          <ul key={idx} className="list-disc pl-6 my-2 text-slate-300 text-sm leading-relaxed">
            <li>{parseInlineBold(listText)}</li>
          </ul>
        );
      }

      // Numbered Lists
      if (/^\d+\.\s+/.test(trimmed)) {
        const match = trimmed.match(/^\d+\.\s+/);
        const listText = trimmed.substring(match![0].length);
        return (
          <ol key={idx} className="list-decimal pl-6 my-2 text-slate-300 text-sm leading-relaxed">
            <li>{parseInlineBold(listText)}</li>
          </ol>
        );
      }

      // Blockquotes
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-4 border-indigo-500 bg-slate-900/30 px-4 py-3 my-6 rounded-r-xl text-slate-300 italic text-sm">
            {trimmed.substring(2)}
          </blockquote>
        );
      }

      // Empty Lines
      if (trimmed === "") {
        return <div key={idx} className="h-4" />;
      }

      // Paragraphs
      return (
        <p key={idx} className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
          {parseInlineBold(trimmed)}
        </p>
      );
    });
  };

  // Parses inline **bold** syntax into React elements
  const parseInlineBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, idx) => {
      // Every odd index is a bold group
      if (idx % 2 === 1) {
        return <strong key={idx} className="text-white font-semibold">{part}</strong>;
      }
      // Every even index is normal text. We also check for inline code ticks: `code`
      return parseInlineCode(part);
    });
  };

  // Parses inline `code` syntax
  const parseInlineCode = (text: string) => {
    const parts = text.split(/`([^`]+)`/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return <code key={idx} className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-indigo-400 text-xs font-mono">{part}</code>;
      }
      return part;
    });
  };

  const formattedDate = article
    ? new Date(article.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      })
    : "";

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          href="/explore"
          className="inline-flex items-center space-x-1 text-sm text-slate-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Explore</span>
        </Link>

        {loading ? (
          <div className="space-y-6">
            <div className="h-8 bg-slate-900/30 rounded-xl w-3/4 animate-pulse"></div>
            <div className="h-4 bg-slate-900/30 rounded-xl w-1/4 animate-pulse"></div>
            <hr className="border-slate-900" />
            <div className="space-y-3">
              <div className="h-4 bg-slate-900/30 rounded-xl animate-pulse"></div>
              <div className="h-4 bg-slate-900/30 rounded-xl animate-pulse"></div>
              <div className="h-4 bg-slate-900/30 rounded-xl w-5/6 animate-pulse"></div>
            </div>
          </div>
        ) : article ? (
          <article>
            {/* Header info */}
            <div className="mb-8">
              {/* Category */}
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-950/40 text-indigo-400 border border-indigo-900/60 text-xs font-semibold uppercase tracking-wider mb-4">
                {article.category}
              </span>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white leading-tight">
                {article.title}
              </h1>

              {/* Metadata */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Published {formattedDate}</span>
                </div>
                <span>•</span>
                <span className="text-slate-400 font-medium">Curated Handbook</span>
              </div>
            </div>

            <hr className="border-slate-900 mb-8" />

            {/* Rendered content */}
            <div className="prose prose-invert max-w-none">
              {renderContent(article.content)}
            </div>

            {/* Tags footer */}
            {article.tags.length > 0 && (
              <div className="mt-12 pt-6 border-t border-slate-900 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400"
                  >
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Related articles section */}
            {related.length > 0 && (
              <section className="mt-16 pt-10 border-t border-slate-900">
                <h3 className="text-lg font-display font-bold text-white mb-6">
                  Related Startup Guides
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      href={`/articles/${item.id}`}
                      className="group flex flex-col p-5 rounded-xl border border-slate-900 hover:border-slate-800 bg-slate-950/20 transition hover:bg-slate-900/10 cursor-pointer"
                    >
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                        {item.category}
                      </span>
                      <h4 className="mt-2 text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                        {item.summary}
                      </p>
                      <div className="mt-4 flex items-center space-x-1 text-xs text-indigo-400 font-medium group-hover:text-indigo-300 transition-colors">
                        <span>Read guide</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        ) : (
          <div className="text-center py-20 bg-slate-900/10 border border-slate-800/40 rounded-2xl p-8">
            <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white">Article not found</h3>
            <p className="text-sm text-slate-400 mt-2">
              The startup guide you are looking for does not exist in our library.
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-flex px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition text-sm font-medium"
            >
              Back to library
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
