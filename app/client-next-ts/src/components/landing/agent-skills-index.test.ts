import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guards the public skill advertised by `HeroSkillInstallDialog`
 * (`npx skills add https://embedded-finance-dev.com/ ...`).
 *
 * Index format: agent-skills discovery RFC v0.2.0 (`type`/`url`/`digest`) plus
 * the legacy `files` array, which the `skills` CLI still requires.
 */

interface SkillIndexEntry {
  name: string;
  type: string;
  description: string;
  url: string;
  digest: string;
  files: string[];
}

const agentSkillsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../public/.well-known/agent-skills'
);

const index = JSON.parse(
  readFileSync(path.join(agentSkillsDir, 'index.json'), 'utf8')
) as { $schema: string; skills: SkillIndexEntry[] };

function readFrontmatterField(markdown: string, field: string) {
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(markdown)?.[1] ?? '';
  return new RegExp(`^${field}: (.+)$`, 'm').exec(frontmatter)?.[1];
}

describe('/.well-known/agent-skills/index.json', () => {
  it('declares the v0.2.0 discovery schema and at least one skill', () => {
    expect(index.$schema).toBe(
      'https://schemas.agentskills.io/discovery/0.2.0/schema.json'
    );
    expect(index.skills.length).toBeGreaterThan(0);
  });

  describe.each(index.skills.map((entry) => [entry.name, entry] as const))(
    '%s',
    (name, entry) => {
      const skillDir = path.join(agentSkillsDir, name);
      const skillMd = readFileSync(path.join(skillDir, 'SKILL.md'));
      const skillText = skillMd.toString('utf8');

      it('is a skill-md entry at the path the skills CLI fetches', () => {
        expect(entry.type).toBe('skill-md');
        expect(entry.url).toBe(`/.well-known/agent-skills/${name}/SKILL.md`);
      });

      it('lists SKILL.md and only files that exist', () => {
        expect(entry.files).toContain('SKILL.md');
        for (const file of entry.files) {
          expect(existsSync(path.join(skillDir, file)), file).toBe(true);
        }
      });

      it('has a digest matching the SKILL.md bytes', () => {
        const actual = `sha256:${createHash('sha256').update(skillMd).digest('hex')}`;
        expect(
          entry.digest,
          'SKILL.md changed: set "digest" in index.json to the expected value'
        ).toBe(actual);
      });

      it('uses LF line endings so the deployed digest is stable', () => {
        expect(skillText.includes('\r\n')).toBe(false);
      });

      it('matches the SKILL.md frontmatter name and description', () => {
        expect(readFrontmatterField(skillText, 'name')).toBe(name);
        expect(readFrontmatterField(skillText, 'description')).toBe(
          entry.description
        );
      });
    }
  );
});
