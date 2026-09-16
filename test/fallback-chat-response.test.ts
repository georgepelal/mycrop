import { describe, it, expect } from 'vitest';
import { generateFallbackChatResponse } from '../server';

describe('generateFallbackChatResponse', () => {
  it('recommends lime for highly acidic soil', () => {
    const reply = generateFallbackChatResponse('how is my ph?', { soilPH: 5.0 });
    expect(reply).toMatch(/highly acidic/);
    expect(reply).toMatch(/limestone/);
  });

  it('recommends sulfur for alkaline soil', () => {
    const reply = generateFallbackChatResponse('what about ph', { soilPH: 8.0 });
    expect(reply).toMatch(/alkaline/);
    expect(reply).toMatch(/sulfur/);
  });

  it('warns about drought stress on low moisture/NDWI', () => {
    const reply = generateFallbackChatResponse('is there a drought risk?', {
      soilMoisture: 20,
      ndwiValue: 0.1,
    });
    expect(reply).toMatch(/drought stress/);
  });

  it('warns about waterlogging on high moisture/NDWI', () => {
    const reply = generateFallbackChatResponse('any irrigation concerns?', {
      soilMoisture: 90,
      ndwiValue: 0.9,
    });
    expect(reply).toMatch(/Halt all irrigation/);
  });

  it('falls back to sensible defaults with no active parcel', () => {
    const reply = generateFallbackChatResponse('nitrogen levels?', null);
    expect(reply).toMatch(/Optimal/);
    expect(reply).toMatch(/your crops/);
  });
});
