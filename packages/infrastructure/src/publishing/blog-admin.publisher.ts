import { BlogPublisherPort, type PublishBlogArticleParams } from '@marketing-service/publishing';

interface BlogAdminResponse {
  articleId?: string;
  kind?: string;
  localizedUrls?: Record<string, string>;
  message?: string;
  detail?: string;
  slug?: string;
  status?: string;
  title?: string;
  translations?: Array<{
    bodyMd?: string;
    excerpt?: string | null;
    locale?: string;
    title?: string;
  }>;
  url?: string;
}

export class BlogAdminPublisher extends BlogPublisherPort {
  async publishArticle(params: PublishBlogArticleParams) {
    const payload = {
      articleId: params.articleId,
      status: params.status ?? 'published',
      coverImageUrl: params.coverImageUrl,
      translations: params.translations,
    };

    const response = await this.request(this.resolveArticlesUrl(), 'POST', payload);
    if (response.ok) {
      return this.toResult(params.articleId, response.payload);
    }

    if (response.status === 409 && response.payload.kind === 'article-id-taken') {
      const { articleId: _articleId, status: _status, ...updatePayload } = payload;
      const existingResponse = await this.request(this.resolveArticlesUrl(params.articleId), 'GET');
      const mergedUpdatePayload = {
        ...updatePayload,
        translations: this.mergeTranslations(
          existingResponse.ok ? existingResponse.payload.translations : null,
          payload.translations,
        ),
      };
      const putResponse = await this.request(
        this.resolveArticlesUrl(params.articleId),
        'PUT',
        mergedUpdatePayload,
      );
      if (putResponse.ok) {
        return this.toResult(params.articleId, putResponse.payload);
      }
      throw this.toError(putResponse.status, putResponse.payload);
    }

    throw this.toError(response.status, response.payload);
  }

  private resolveArticlesUrl(articleId?: string): string {
    const rawBase = process.env.BLOG_ADMIN_BASE_URL?.trim();
    if (!rawBase) {
      throw new Error('BLOG_ADMIN_BASE_URL is not configured');
    }
    const base = rawBase.replace(/\/+$/, '');
    const articlePath = articleId ? `/${encodeURIComponent(articleId)}` : '';
    if (base.endsWith('/v1/blog')) {
      return `${base}/admin/articles${articlePath}`;
    }
    return `${base}/v1/blog/admin/articles${articlePath}`;
  }

  private resolveApiKey(): string {
    const key = process.env.BLOG_ADMIN_API_KEY?.trim();
    if (!key) {
      throw new Error('BLOG_ADMIN_API_KEY is not configured');
    }
    return key;
  }

  private async request(
    url: string,
    method: 'GET' | 'POST' | 'PUT',
    payload?: Record<string, unknown>,
  ): Promise<{ ok: boolean; payload: BlogAdminResponse; status: number }> {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.resolveApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const text = await response.text();
    return {
      ok: response.ok,
      payload: this.parseResponse(text),
      status: response.status,
    };
  }

  private parseResponse(text: string): BlogAdminResponse {
    if (!text.trim()) {
      return {};
    }
    try {
      const parsed = JSON.parse(text) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as BlogAdminResponse)
        : { message: text };
    } catch {
      return { message: text };
    }
  }

  private toResult(articleId: string, payload: BlogAdminResponse) {
    return {
      articleId: payload.articleId ?? articleId,
      localizedUrls: this.readStringRecord(payload.localizedUrls),
      slug: payload.slug ?? null,
      status: payload.status ?? null,
      url: payload.url ?? null,
    };
  }

  private readStringRecord(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  }

  private mergeTranslations(
    existing: BlogAdminResponse['translations'] | null | undefined,
    next: PublishBlogArticleParams['translations'],
  ): PublishBlogArticleParams['translations'] {
    const byLocale = new Map<string, PublishBlogArticleParams['translations'][number]>();
    for (const translation of existing ?? []) {
      if (
        typeof translation.locale === 'string' &&
        typeof translation.title === 'string' &&
        typeof translation.bodyMd === 'string'
      ) {
        byLocale.set(translation.locale, {
          locale: translation.locale,
          title: translation.title,
          excerpt: typeof translation.excerpt === 'string' ? translation.excerpt : null,
          bodyMd: translation.bodyMd,
        });
      }
    }
    for (const translation of next) {
      byLocale.set(translation.locale, translation);
    }
    return [...byLocale.values()];
  }

  private toError(status: number, payload: BlogAdminResponse): Error {
    const message =
      payload.detail ??
      payload.title ??
      payload.message ??
      `Blog admin request failed with HTTP ${status}`;
    return new Error(message);
  }
}
