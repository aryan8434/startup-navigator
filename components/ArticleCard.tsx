import Link from "next/link";
import { 
  Building2, 
  Coins, 
  ShieldCheck, 
  Users, 
  Palette, 
  Megaphone, 
  Percent, 
  FileSpreadsheet, 
  Cpu, 
  TrendingUp, 
  ArrowRight,
  Calendar
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  createdAt: string;
}

// Map categories to distinct icons and theme colors
const categoryConfig: Record<string, { icon: any; color: string; bg: string }> = {
  "Company Registration": { icon: Building2, color: "text-blue-400", bg: "bg-blue-950/30 border-blue-900/30" },
  "Funding": { icon: Coins, color: "text-emerald-400", bg: "bg-emerald-950/30 border-emerald-900/30" },
  "Legal Compliance": { icon: ShieldCheck, color: "text-red-400", bg: "bg-red-950/30 border-red-900/30" },
  "Hiring": { icon: Users, color: "text-purple-400", bg: "bg-purple-950/30 border-purple-900/30" },
  "Branding": { icon: Palette, color: "text-pink-400", bg: "bg-pink-950/30 border-pink-900/30" },
  "Marketing": { icon: Megaphone, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/30" },
  "Taxation": { icon: Percent, color: "text-cyan-400", bg: "bg-cyan-950/30 border-cyan-900/30" },
  "Fundraising": { icon: FileSpreadsheet, color: "text-orange-400", bg: "bg-orange-950/30 border-orange-900/30" },
  "AI Tools": { icon: Cpu, color: "text-indigo-400", bg: "bg-indigo-950/30 border-indigo-900/30" },
  "Business Growth": { icon: TrendingUp, color: "text-teal-400", bg: "bg-teal-950/30 border-teal-900/30" },
};

export default function ArticleCard({ article }: { article: Article }) {
  const config = categoryConfig[article.category] || { 
    icon: Building2, 
    color: "text-slate-400", 
    bg: "bg-slate-950/30 border-slate-900/30" 
  };
  const IconComponent = config.icon;

  const formattedDate = new Date(article.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <article className={`flex flex-col h-full rounded-2xl glassmorphism-card ${config.bg} p-6 overflow-hidden`}>
      {/* Category Indicator */}
      <div className="flex items-center space-x-2 mb-4">
        <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${config.color}`}>
          <IconComponent className="h-4 w-4" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {article.category}
        </span>
      </div>

      {/* Title */}
      <Link href={`/articles/${article.id}`} className="group/title">
        <h3 className="text-lg font-display font-semibold text-white leading-snug group-hover/title:text-indigo-400 transition-colors duration-200 line-clamp-2">
          {article.title}
        </h3>
      </Link>

      {/* Summary */}
      <p className="mt-3 text-sm text-slate-400 leading-relaxed line-clamp-3 flex-grow">
        {article.summary}
      </p>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formattedDate}</span>
        </div>
        
        <Link 
          href={`/articles/${article.id}`} 
          className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <span>Read guide</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}
