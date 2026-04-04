import { EmbeddedDocStory } from '@/components/embedded-doc-story';

import dateParsingGuide from '@ef-docs/DATE_PARSING_GUIDE.md?raw';

export default function DateParsingGuideArticle() {
  return (
    <EmbeddedDocStory
      markdown={dateParsingGuide}
      docPath="DATE_PARSING_GUIDE.md"
    />
  );
}
