import { describe, expect, it } from 'vitest';
import {
  formatArticle,
  formatArticleList,
  htmlToText,
  getConfigFromEnv,
  resourceResult,
  textResult,
} from '../../src/utils/index.js';
import * as tools from '../../src/tools/index.js';

describe('utils', () => {
  it('getConfigFromEnv reads required env vars', () => {
    const prev = { ...process.env };
    process.env.FRESHRSS_URL = 'http://example.com';
    process.env.FRESHRSS_USERNAME = 'user';
    process.env.FRESHRSS_API_PASSWORD = 'pass';

    expect(getConfigFromEnv()).toEqual({
      baseUrl: 'http://example.com',
      username: 'user',
      apiPassword: 'pass',
    });

    process.env = prev;
  });

  it('getConfigFromEnv throws when missing values', () => {
    const prev = { ...process.env };
    delete process.env.FRESHRSS_URL;
    process.env.FRESHRSS_USERNAME = 'user';
    process.env.FRESHRSS_API_PASSWORD = 'pass';
    expect(() => getConfigFromEnv()).toThrow(/FRESHRSS_URL/);

    process.env.FRESHRSS_URL = 'http://example.com';
    delete process.env.FRESHRSS_USERNAME;
    expect(() => getConfigFromEnv()).toThrow(/FRESHRSS_USERNAME/);

    process.env.FRESHRSS_USERNAME = 'user';
    delete process.env.FRESHRSS_API_PASSWORD;
    expect(() => getConfigFromEnv()).toThrow(/FRESHRSS_API_PASSWORD/);

    process.env = prev;
  });

  it('formatArticle includes status and omits empty optional fields', () => {
    const out = formatArticle({
      title: 'Hello',
      url: 'http://example.com/a',
      feedTitle: '',
      author: undefined,
      isRead: false,
      isStarred: true,
      published: 0,
      content: 'Body',
    });

    expect(out).toContain('## Hello');
    expect(out).toContain('**Status:** ○ Unread ★');
    expect(out).toContain('**URL:** http://example.com/a');
    expect(out).toContain('Body');
    expect(out).not.toContain('**Feed:**');
    expect(out).not.toContain('**Author:**');
  });

  it('formatArticle includes feed title and author when present', () => {
    const out = formatArticle({
      title: 'Hello',
      url: 'http://example.com/a',
      feedTitle: 'My Feed',
      author: 'Alice',
      isRead: true,
      isStarred: false,
      published: 0,
      content: 'Body',
    });

    expect(out).toContain('**Feed:** My Feed');
    expect(out).toContain('**Author:** Alice');
  });

  it('formatArticleList handles empty and non-empty lists', () => {
    expect(formatArticleList([])).toBe('No articles found.');

    const out = formatArticleList([
      {
        id: 'abc',
        title: 'T1',
        feedTitle: 'Feed',
        isRead: true,
        isStarred: false,
        published: 0,
      },
    ]);

    expect(out).toContain('✓');
    expect(out).toContain('T1');
    expect(out).toContain('[Feed]');
    expect(out).toContain('ID: abc');
  });

  it('formatArticleList includes url and plain-text content when requested', () => {
    const article = {
      id: 'abc',
      title: 'T1',
      url: 'https://example.com/post',
      content: '<p>Hello &amp; <b>welcome</b></p><p>Second&nbsp;para</p>',
      isRead: false,
      isStarred: false,
      published: 0,
    };

    const withoutContent = formatArticleList([article]);
    expect(withoutContent).toContain('URL: https://example.com/post');
    expect(withoutContent).not.toContain('Content:');

    const withContent = formatArticleList([article], { includeContent: true });
    expect(withContent).toContain('URL: https://example.com/post');
    expect(withContent).toContain('    Hello & welcome');
    expect(withContent).toContain('    Second para');
    expect(withContent).not.toContain('<p>');

    const truncated = formatArticleList([article], { includeContent: true, maxContentLength: 5 });
    expect(truncated).toContain('    Hello… [truncated]');
  });

  it('htmlToText strips tags, scripts and decodes entities', () => {
    expect(htmlToText('<script>x()</script>A<br/>B &#39;C&#x27; &lt;D&gt;')).toBe("A\nB 'C' <D>");
  });

  it('textResult and resourceResult build MCP results', () => {
    expect(textResult('hi')).toEqual({ content: [{ type: 'text', text: 'hi' }] });
    expect(resourceResult({ uri: 'x://y', mimeType: 'text/plain', text: 'hello' })).toEqual({
      content: [
        { type: 'resource', resource: { uri: 'x://y', mimeType: 'text/plain', text: 'hello' } },
      ],
    });
  });

  it('tools index re-exports schemas', () => {
    expect(tools.listArticlesSchema).toBeDefined();
    expect(tools.subscribeSchema).toBeDefined();
    expect(tools.modifyLabelsSchema).toBeDefined();
    expect(tools.listFaviconsSchema).toBeDefined();
  });
});
