import dateParsingGuide from '@ef-docs/DATE_PARSING_GUIDE.md?raw';

import { EmbeddedDocStory } from '@/components/embedded-doc-story';

export default function DateParsingGuideArticle() {
  return (
    <EmbeddedDocStory
      markdown={dateParsingGuide}
      docPath="DATE_PARSING_GUIDE.md"
    />
  );
}
