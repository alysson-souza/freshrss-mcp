/**
 * Format an article for display
 */
export function formatArticle(article: {
  title: string;
  url: string;
  feedTitle?: string;
  author?: string;
  isRead: boolean;
  isStarred: boolean;
  published: number;
  content: string;
}): string {
  const status = [article.isRead ? '✓ Read' : '○ Unread', article.isStarred ? '★' : '']
    .filter((s) => s !== '')
    .join(' ');

  const date = new Date(article.published / 1000).toLocaleString();

  return [
    `## ${article.title}`,
    `**Status:** ${status}`,
    article.feedTitle !== undefined && article.feedTitle !== ''
      ? `**Feed:** ${article.feedTitle}`
      : '',
    article.author !== undefined && article.author !== '' ? `**Author:** ${article.author}` : '',
    `**Published:** ${date}`,
    `**URL:** ${article.url}`,
    '',
    article.content,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/**
 * Convert an HTML fragment to readable plain text
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => HTML_ENTITIES[name.toLowerCase()] ?? entity)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Format a list of articles as a summary
 */
export function formatArticleList(
  articles: {
    id: string;
    title: string;
    url?: string;
    content?: string;
    feedTitle?: string;
    isRead: boolean;
    isStarred: boolean;
    published: number;
  }[],
  options: { includeContent?: boolean; maxContentLength?: number } = {}
): string {
  if (articles.length === 0) {
    return 'No articles found.';
  }

  const maxLength = options.maxContentLength ?? 0;

  return articles
    .map((a) => {
      const status = a.isRead ? '✓' : '○';
      const star = a.isStarred ? '★ ' : '';
      const date = new Date(a.published / 1000).toLocaleDateString();
      const feed = a.feedTitle !== undefined && a.feedTitle !== '' ? ` [${a.feedTitle}]` : '';
      const lines = [`${status} ${star}${a.title}${feed} (${date}) - ID: ${a.id}`];

      if (a.url !== undefined && a.url !== '') {
        lines.push(`  URL: ${a.url}`);
      }

      if (options.includeContent === true && a.content !== undefined && a.content !== '') {
        let text = htmlToText(a.content);
        if (maxLength > 0 && text.length > maxLength) {
          text = `${text.slice(0, maxLength).trimEnd()}… [truncated]`;
        }
        if (text !== '') {
          lines.push('  Content:', ...text.split('\n').map((l) => `    ${l}`));
        }
      }

      return lines.join('\n');
    })
    .join(options.includeContent === true ? '\n\n' : '\n');
}
