// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// For a user/org GitHub Pages site (USERNAME.github.io), the site lives at the
// domain root, so `base` stays '/'. Update `site` if a custom domain is used.
export default defineConfig({
  site: 'https://huazhongyun.github.io',
  base: '/',
  integrations: [sitemap()],
  build: {
    // emit cleaner /publications/ style URLs
    format: 'directory',
  },
});
