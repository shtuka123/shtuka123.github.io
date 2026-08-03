import { getCollection } from 'astro:content';
import { site } from '../data/site';

export async function getAllPosts() {
  if (!site.blogVisible) {
    return [];
  }

  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getPostsByTag(tag: string) {
  const posts = await getAllPosts();
  return posts.filter((post) => post.data.tags.includes(tag));
}
