import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { FreshRSSClient } from '../api/index.js';
import {
  listArticlesSchema,
  markArticlesSchema,
  starArticlesSchema,
  markAllReadSchema,
} from '../tools/article-tools.js';
import { formatArticleList } from '../utils/formatters.js';
import { textResult } from '../utils/mcp-results.js';
import { wrapTool } from '../utils/tool-errors.js';

/**
 * Register article-related tools
 */
export function registerArticleTools(server: McpServer, client: FreshRSSClient): void {
  server.registerTool(
    'list_articles',
    {
      description: 'List articles from FreshRSS with optional filtering',
      inputSchema: listArticlesSchema,
    },
    wrapTool('list_articles', async (args: z.infer<typeof listArticlesSchema>) => {
      const { includeContent, maxContentLength, ...listOptions } = args;
      const result = await client.articles.list(listOptions);
      const formatted = formatArticleList(result.articles, {
        includeContent: includeContent ?? true,
        maxContentLength: maxContentLength ?? 2000,
      });
      const continuation =
        result.continuation !== undefined
          ? `\n\nMore articles available. Use continuation: ${result.continuation}`
          : '';

      return textResult(formatted + continuation);
    })
  );

  server.registerTool(
    'mark_as_read',
    {
      description: 'Mark one or more articles as read',
      inputSchema: markArticlesSchema,
    },
    wrapTool('mark_as_read', async (args: z.infer<typeof markArticlesSchema>) => {
      await client.articles.markAsRead(args.articleIds);
      return textResult(`Marked ${args.articleIds.length.toString()} article(s) as read.`);
    })
  );

  server.registerTool(
    'mark_as_unread',
    {
      description: 'Mark one or more articles as unread',
      inputSchema: markArticlesSchema,
    },
    wrapTool('mark_as_unread', async (args: z.infer<typeof markArticlesSchema>) => {
      await client.articles.markAsUnread(args.articleIds);
      return textResult(`Marked ${args.articleIds.length.toString()} article(s) as unread.`);
    })
  );

  server.registerTool(
    'star_articles',
    {
      description: 'Star/favorite one or more articles',
      inputSchema: starArticlesSchema,
    },
    wrapTool('star_articles', async (args: z.infer<typeof starArticlesSchema>) => {
      await client.articles.star(args.articleIds);
      return textResult(`Starred ${args.articleIds.length.toString()} article(s).`);
    })
  );

  server.registerTool(
    'unstar_articles',
    {
      description: 'Remove star from one or more articles',
      inputSchema: starArticlesSchema,
    },
    wrapTool('unstar_articles', async (args: z.infer<typeof starArticlesSchema>) => {
      await client.articles.unstar(args.articleIds);
      return textResult(`Unstarred ${args.articleIds.length.toString()} article(s).`);
    })
  );

  server.registerTool(
    'mark_all_as_read',
    {
      description: 'Mark all articles in a stream as read',
      inputSchema: markAllReadSchema,
    },
    wrapTool('mark_all_as_read', async (args: z.infer<typeof markAllReadSchema>) => {
      await client.articles.markAllAsRead(args.streamId, args.olderThan);
      return textResult('Marked all articles in stream as read.');
    })
  );
}
