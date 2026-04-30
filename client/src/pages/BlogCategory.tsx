import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, Eye, ChevronRight, BookOpen, Layers } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";

export default function BlogCategory() {
  const params = useParams<{ slug: string }>();
  const { data: category, isLoading } = trpc.blog.categoryBySlug.useQuery(
    { slug: params.slug || "" },
    { enabled: !!params.slug }
  );
  const { data: categories } = trpc.blog.categories.useQuery();

  const jsonLd = useMemo(() => {
    if (!category) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: category.name,
      description: category.metaDescription || category.description,
      url: `https://mybiseo.com/blog/category/${category.slug}`,
      isPartOf: {
        "@type": "WebSite",
        name: "MY비서 블로그",
        url: "https://mybiseo.com/blog",
      },
      ...(category.posts && category.posts.length > 0
        ? {
            hasPart: category.posts.map((p) => ({
              "@type": "Article",
              headline: p.title,
              url: `https://mybiseo.com/blog/${p.slug}`,
            })),
          }
        : {}),
    };
  }, [category]);

  useSEO({
    title: category?.metaTitle || `${category?.name || "카테고리"} | MY비서 블로그`,
    description: category?.metaDescription || category?.description || undefined,
    canonical: category ? `https://mybiseo.com/blog/category/${category.slug}` : undefined,
    jsonLd,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-10 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">카테고리를 찾을 수 없습니다</h1>
          <Link href="/blog">
            <Button variant="outline">블로그로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const otherCategories = categories?.filter((c) => c.slug !== category.slug) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-b from-background to-muted/30 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" />
                블로그
              </Button>
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm text-primary font-medium">{category.name}</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-display">{category.name}</h1>
          </div>
          {category.description && (
            <p className="text-muted-foreground text-lg max-w-2xl">{category.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Posts Grid */}
        {category.posts && category.posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {category.posts.map((post) => (
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
        ) : (
          <div className="text-center py-20 text-muted-foreground mb-16">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>이 카테고리에 아직 게시된 글이 없습니다.</p>
          </div>
        )}

        {/* Other Categories */}
        {otherCategories.length > 0 && (
          <section className="border-t border-border/50 pt-12">
            <h2 className="text-xl font-semibold mb-6">다른 진료과 마케팅 가이드</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherCategories.map((cat) => (
                <Link key={cat.id} href={`/blog/category/${cat.slug}`}>
                  <div className="group rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 p-5 cursor-pointer">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{cat.description}</p>
                    <span className="text-xs text-muted-foreground mt-2 block">{cat.postCount}개 글</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
