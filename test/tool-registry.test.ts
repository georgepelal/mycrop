import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  SLUG_BY_LEGACY_PATH,
  TOOLS,
  TOOLS_BY_SLUG,
  navPathFor,
  searchTools,
  toolsInCategory,
} from '../src/tools/registry';

// The registry is the single source of truth for the catalog, the sidebar, the
// routes and search. A malformed entry breaks all four, so it is worth pinning.
describe('tool registry', () => {
  it('holds every tool exactly once, by slug and by legacy path', () => {
    const slugs = TOOLS.map((t) => t.slug);
    const paths = TOOLS.map((t) => t.legacyPath);
    expect(new Set(slugs).size).toBe(TOOLS.length);
    expect(new Set(paths).size).toBe(TOOLS.length);
    expect(TOOLS.length).toBeGreaterThan(50);
  });

  it('gives every tool a usable identity', () => {
    for (const tool of TOOLS) {
      expect(tool.slug, tool.title).toMatch(/^[a-z0-9-]+$/);
      expect(tool.title.length, tool.slug).toBeGreaterThan(2);
      expect(tool.blurb.trim().endsWith('.'), tool.slug).toBe(true);
      expect(tool.keywords.length, tool.slug).toBeGreaterThan(0);
      expect(tool.legacyPath, tool.slug).toMatch(/^\//);
      expect(CATEGORIES.map((c) => c.id)).toContain(tool.category);
    }
  });

  // The rule from AGENTS.md, encoded: a tool either names the upstream it reads
  // or carries a notice explaining why it has none. Silence is what got us here.
  it('requires every tool to declare a source or explain its absence', () => {
    for (const tool of TOOLS) {
      if (tool.sources.length === 0) {
        expect(tool.notice, `${tool.slug} has no source and no notice`).toBeTruthy();
      }
      for (const source of tool.sources) {
        expect(source.name, tool.slug).toBeTruthy();
        expect(source.url, tool.slug).toMatch(/^https:\/\//);
      }
    }
  });

  it('maps every legacy path to its new slug', () => {
    for (const tool of TOOLS) {
      expect(SLUG_BY_LEGACY_PATH[tool.legacyPath]).toBe(tool.slug);
      // The sidebar's ids are the legacy paths without the leading slash.
      expect(navPathFor(tool.legacyPath.slice(1))).toBe(`/tools/${tool.slug}`);
    }
  });

  it('leaves non-tool nav ids alone', () => {
    expect(navPathFor('settings')).toBe('/settings');
    expect(navPathFor('account')).toBe('/account');
  });

  it('indexes every tool by slug', () => {
    for (const tool of TOOLS) {
      expect(TOOLS_BY_SLUG[tool.slug]).toBe(tool);
    }
    expect(TOOLS_BY_SLUG['no-such-tool']).toBeUndefined();
  });

  it('sorts every tool into exactly one category, and leaves none empty', () => {
    const counted = CATEGORIES.reduce((n, c) => n + toolsInCategory(c.id).length, 0);
    expect(counted).toBe(TOOLS.length);
    for (const category of CATEGORIES) {
      expect(toolsInCategory(category.id).length, category.id).toBeGreaterThan(0);
    }
  });
});

describe('catalog search', () => {
  it('returns everything for an empty query', () => {
    expect(searchTools('   ')).toHaveLength(TOOLS.length);
  });

  it('finds tools by source name', () => {
    const slugs = searchTools('NASA').map((t) => t.slug);
    expect(slugs).toContain('climatology');
    expect(slugs).toContain('eonet-events');
  });

  it('finds tools by title and by keyword', () => {
    expect(searchTools('frost').map((t) => t.slug)).toContain('frost-freeze-risk');
    expect(searchTools('bees').map((t) => t.slug)).toContain('pollinator-outlooks');
  });

  it('requires every term to match', () => {
    const both = searchTools('soil carbon').map((t) => t.slug);
    expect(both).toContain('soil-organic-carbon');
    // Narrower than either term alone.
    expect(both.length).toBeLessThan(searchTools('soil').length);
    expect(searchTools('frost bees')).toHaveLength(0);
  });

  it('ignores case', () => {
    expect(searchTools('GbIf').length).toBe(searchTools('gbif').length);
  });
});

describe('lazy tool modules', () => {
  // Proves the 60 dynamic imports resolve and each page really has a default
  // export, which is what the router assumes when it lazy-loads a tool.
  it('every tool loads a module with a default export', async () => {
    const failures: string[] = [];
    for (const tool of TOOLS) {
      try {
        const mod = await tool.load();
        if (typeof mod.default !== 'function') {
          failures.push(`${tool.slug}: default export is ${typeof mod.default}`);
        }
      } catch (err) {
        failures.push(`${tool.slug}: ${(err as Error).message.split('\n')[0]}`);
      }
    }
    expect(failures).toEqual([]);
  }, 120_000);
});

// Phase 4 collapsed three prop shapes into one. These guard the collapse:
// nothing should reintroduce a bespoke contract or a hardcoded default city.
describe('the tool prop contract', () => {
  it('leaves every tool on one of the two supported shapes', () => {
    for (const tool of TOOLS) {
      expect(['tool', 'none'], tool.slug).toContain(tool.takesProps);
    }
  });

  it('gives a tool that needs a location the props to receive one', () => {
    for (const tool of TOOLS) {
      if (tool.needs === 'location' || tool.needs === 'field') {
        expect(tool.takesProps, `${tool.slug} needs a location but takes no props`).toBe('tool');
      }
    }
  });
});
