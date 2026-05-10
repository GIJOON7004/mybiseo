import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, Eye, Tag, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { LightMarkdown } from "@/components/LightMarkdown";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { useMemo } from "react";
import { useEventLogger } from "@/hooks/useEventLogger";
import { APP_BASE_URL, APP_DOMAIN } from "@/lib/site-config";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const { logEvent } = useEventLogger();
  const { data: post, isLoading } = trpc.blog.postBySlug.useQuery(
    { slug: params.slug || "" },
    { enabled: !!params.slug }
  );

  // Related posts from same category
  const { data: categoryData } = trpc.blog.categoryBySlug.useQuery(
    { slug: post?.category?.slug || "" },
    { enabled: !!post?.category?.slug }
  );

  const relatedPosts = categoryData?.posts?.filter((p) => p.id !== post?.id).slice(0, 3) ?? [];

  // Build Article + BreadcrumbList JSON-LD
  const jsonLd = useMemo(() => {
    if (!post) return undefined;
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      datePublished: new Date(post.createdAt).toISOString(),
      dateModified: new Date(post.updatedAt).toISOString(),
      author: {
        "@type": "Organization",
        name: "MY비서",
        url: APP_BASE_URL,
      },
      publisher: {
        "@type": "Organization",
        name: "MY비서",
        url: APP_BASE_URL,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${APP_BASE_URL}/blog/${post.slug}`,
      },
      ...(post.tags
        ? { keywords: post.tags.split(",").map((t: string) => t.trim()).join(", ") }
        : {}),
      wordCount: post.content.length,
      timeRequired: `PT${post.readingTime}M`,
      articleSection: post.category?.name || "블로그",
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "홈",
          item: APP_BASE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "블로그",
          item: `${APP_BASE_URL}/blog`,
        },
        ...(post.category ? [{
          "@type": "ListItem",
          position: 3,
          name: post.category.name,
          item: `${APP_BASE_URL}/blog/category/${post.category.slug}`,
        }] : []),
        {
          "@type": "ListItem",
          position: post.category ? 4 : 3,
          name: post.title,
          item: `${APP_BASE_URL}/blog/${post.slug}`,
        },
      ],
    };
    return [article, breadcrumb];
  }, [post]);

  useSEO({
    title: post?.metaTitle || post?.title || "블로그 | MY비서",
    description: post?.metaDescription || post?.excerpt,
    canonical: post ? `${APP_BASE_URL}/blog/${post.slug}` : undefined,
    ogType: "article",
    jsonLd,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-10 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="space-y-3 pt-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-muted rounded w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">글을 찾을 수 없습니다</h1>
          <Link href="/blog">
            <Button variant="outline">블로그로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Article Header */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 pt-24 pb-10">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" />
                블로그
              </Button>
            </Link>
            {post.category && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <Link href={`/blog/category/${post.category.slug}`}>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                    {post.category.name}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {post.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.split(",").map((tag: string, i: number) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold font-display leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>

          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readingTime}분 읽기
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              조회 {post.viewCount}
            </span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-li:text-muted-foreground prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground">
          <LightMarkdown>{post.content}</LightMarkdown>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border/50 bg-muted/10">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              관련 글
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`}>
                  <div className="group rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 p-5 cursor-pointer">
                    <h3 className="font-medium text-sm mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {rp.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{rp.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI 검색 진단 CTA */}
      <section className="border-t border-border/50 bg-gradient-to-br from-violet-500/5 to-blue-500/5">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-bold mb-2">우리 병원 사이트, AI에 잘 노출되고 있을까?</h2>
          <p className="text-sm text-muted-foreground mb-5">
            30초 만에 병원 홈페이지의 AI 인용 점수를 확인해보세요.
          </p>
          <Link href="/seo-checker">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-700 hover:to-blue-700">
              무료 AI 인용 진단받기
            </Button>
          </Link>
        </div>
      </section>

      {/* 뉴스레터 구독 */}
      <section className="border-t border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <NewsletterSubscribe source="blog" />
        </div>
      </section>

      {/* 기존 CTA */}
      <section className="border-t border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">AI 마케팅, 직접 경험해보세요</h2>
          <p className="text-muted-foreground mb-6">
            무료 상담으로 우리 병원에 맞는 AI 마케팅 방법을 알아보세요.
          </p>
          <Link href="/#contact">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              무료 상담 신청하기
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
