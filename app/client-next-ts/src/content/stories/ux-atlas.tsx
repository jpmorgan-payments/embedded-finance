import uxAtlas from '@ef-docs/UX_ATLAS.md?raw';

import { EmbeddedDocStory } from '@/components/embedded-doc-story';

export default function UxAtlasArticle() {
  return <EmbeddedDocStory markdown={uxAtlas} docPath="UX_ATLAS.md" />;
}
