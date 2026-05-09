import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Clock, Eye, Tag, ChevronRight, BookOpen, Stethoscope, Sparkles, Search, Heart, Leaf, Smile, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";

const categoryIcons: Record<string, React.ReactNode> = {
  "plastic-surgery": <Heart className="w-5 h-5" />,
  "dermatology": <Sparkles className="w-5 h-5" />,
  "dental": <Smile className="w-5 h-5" />,
  "korean-medicine": <Leaf className="w-5 h-5" />,
  "hospital-seo": <Search className="w-5 h-5" />,
  "ai-marketing-trend": <Stethoscope className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  "plastic-surgery": "from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/20",
  "dermatology": "from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/20",
  "dental": "from-sky-500/20 to-blue-500/10 text-sky-400 border-sky-500/20",
  "korean-medicine": "from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/20",
  "hospital-seo": "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20",
  "ai-marketing-trend": "from-cyan-500/20 to-teal-500/10 text-cyan-400 border-cyan-500/20",
};

const POSTS_PER_PAGE = 9;

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: postsData, isLoading: postsLoading } = trpc.blog.posts.useQuery({ limit: 200 });
  const { data: categories, isLoading: catsLoading } = trpc.blog.categories.useQuery();

  // 필터링된 포스트
  const filteredPosts = useMemo(() => {
    if (!postsData?.posts) return [];
    let posts = postsData.posts;

    // 카테고리 필터
    if (selectedCategory) {
      const cat = categories?.find(c => c.slug === selectedCategory);
      if (cat) posts = posts.filter(p => p.categoryId === cat.id);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        (p.tags && p.tags.toLowerCase().includes(q))
      );
    }

    return posts;
  }, [postsData, selectedCategory, searchQuery, categories]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  useSEO({
    title: "병원 마케팅 블로그 | MY비서 - 진료과별 AI 마케팅 가이드",
    description: "성형외과, 피부과, 치과, 한의원 등 진료과별 AI 마케팅 전략과 AI 검색 최적화 가이드. 병원 원장님을 위한 실전 마케팅 노하우를 확인하세요.",
    canonical: "https://mybiseo.com/blog",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "MY비서 병원 마케팅 블로그",
      description: "진료과별 AI 마케팅 전략과 AI 검색 최적화 가이드",
      url: "https://mybiseo.com/blog",
      publisher: {
        "@type": "Organization",
        name: "MY비서",
        url: "https://mybiseo.com",
      },
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-b from-background to-muted/30 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-display">병원 마케팅 블로그</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            진료과별 AI 마케팅 전략, AI 검색 최적화 가이드, 실전 사례를 확인하세요.<br />
            <span className="text-sm text-primary/80">원장님의 매출 성장을 돕는 실용 콘텐츠만 담았습니다.</span>
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Search + Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          {/* 검색 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="키워드로 검색..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              전체
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.slug === selectedCategory ? null : cat.slug); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category Hub Cards (only when no filter active) */}
        {!selectedCategory && !searchQuery && !catsLoading && categories && categories.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              진료과별 마케팅 가이드
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const colorClass = categoryColors[cat.slug] || "from-primary/20 to-primary/10 text-primary border-primary/20";
                const icon = categoryIcons[cat.slug] || <Stethoscope className="w-5 h-5" />;
                return (
                  <Link key={cat.id} href={`/blog/category/${cat.slug}`}>
                    <div className="group relative rounded-xl border bg-card/50 hover:bg-card transition-all duration-300 p-6 cursor-pointer overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass.split(" ").slice(0, 2).join(" ")} opacity-30 group-hover:opacity-50 transition-opacity`} />
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass.split(" ").slice(0, 2).join(" ")} flex items-center justify-center mb-3 ${colorClass.split(" ").slice(2, 3).join(" ")}`}>
                          {icon}
                        </div>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {cat.description}
                        </p>
                        <div className="flex items-center justify-between">
                          {cat.postCount === 0 ? (
                            <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground">준비 중</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{cat.postCount}개 글</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Posts Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {selectedCategory
                ? `${categories?.find(c => c.slug === selectedCategory)?.name || ""} 글`
                : searchQuery
                  ? `"${searchQuery}" 검색 결과`
                  : "최신 병원 마케팅 인사이트"
              }
            </h2>
            <span className="text-sm text-muted-foreground">{filteredPosts.length}개 글</span>
          </div>

          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card/30 p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                  <div className="h-6 bg-muted rounded w-full mb-3" />
                  <div className="h-4 bg-muted rounded w-2/3 mb-6" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : paginatedPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <article className="group rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 p-6 cursor-pointer h-full flex flex-col">
                      {post.tags && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.split(",").slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readingTime}분
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.viewCount}
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{searchQuery ? `"${searchQuery}"에 대한 검색 결과가 없습니다.` : "아직 게시된 글이 없습니다."}</p>
            </div>
          )}
        </section>

        {/* CTA Banner */}
        <section className="mt-16 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12 text-center">
          <h3 className="text-2xl font-bold mb-3">우리 병원 마케팅, AI로 시작하세요</h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            블로그에서 읽은 전략을 직접 실행하기 어려우시다면,<br />
            MY비서가 도와드립니다. 무료 진단부터 시작하세요.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              무료 마케팅 진단 받기
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
