export interface PublishBlogArticleTranslation {
  locale: string;
  title: string;
  excerpt?: string | null;
  bodyMd: string;
}

export interface PublishBlogArticleParams {
  articleId: string;
  status?: 'draft' | 'published';
  coverImageUrl: string;
  translations: PublishBlogArticleTranslation[];
}

export interface PublishBlogArticleResult {
  articleId: string;
  slug: string | null;
  status: string | null;
  url: string | null;
  localizedUrls: Record<string, string>;
}

export abstract class BlogPublisherPort {
  abstract publishArticle(params: PublishBlogArticleParams): Promise<PublishBlogArticleResult>;
}
