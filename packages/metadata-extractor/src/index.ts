import axios from 'axios';
import * as cheerio from 'cheerio';

export interface WebsiteMetadata {
  title: string;
  description: string;
  favicon: string;
  appleTouchIcon?: string;
  ogImage: string;
  themeColor: string;
  url: string;
}

export async function extractMetadata(url: string): Promise<WebsiteMetadata> {
  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'FoldaaBot/1.0 (https://foldaa.app)',
    },
    timeout: 10000,
  });

  const $ = cheerio.load(html);
  const metadata: WebsiteMetadata = {
    title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
    description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
    favicon: '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
    themeColor: $('meta[name="theme-color"]').attr('content') || '#000000',
    url,
  };

  // 1. Icon Fallback Chain
  // Order: apple-touch-icon > rel="icon" > rel="shortcut icon" > /favicon.ico
  let iconUrl = 
    $('link[rel="apple-touch-icon"]').attr('href') || 
    $('link[rel="icon"]').attr('href') || 
    $('link[rel="shortcut icon"]').attr('href');

  if (!iconUrl) {
    iconUrl = '/favicon.ico';
  }

  metadata.favicon = new URL(iconUrl, url).toString();

  // 2. Apple Touch Icon (specific)
  const appleIcon = $('link[rel="apple-touch-icon"]').attr('href');
  if (appleIcon) {
    metadata.appleTouchIcon = new URL(appleIcon, url).toString();
  }

  // 3. Ensure OG Image is absolute
  if (metadata.ogImage && !metadata.ogImage.startsWith('http')) {
    metadata.ogImage = new URL(metadata.ogImage, url).toString();
  } else if (!metadata.ogImage) {
    // Fallback OG image if not provided
    metadata.ogImage = metadata.favicon;
  }

  return metadata;
}
