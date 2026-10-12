import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aniruddh.xyz',
  integrations: [mdx(), sitemap({
    filter: (page) => !/^\/misc(\/|$)/.test(new URL(page).pathname)
  })],
  markdown: {
    syntaxHighlight: 'prism'
  }
});
