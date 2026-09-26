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

  it('says a reading is missing instead of inventing one', () => {
    const reply = generateFallbackChatResponse('nitrogen levels?', null);
    expect(reply).not.toMatch(/Optimal/);
    expect(reply).toMatch(/no nitrogen status recorded/);
    const ph = generateFallbackChatResponse('how is my ph?', { name: 'North' });
    expect(ph).not.toMatch(/6\.5/);
    expect(ph).toMatch(/no soil pH recorded/);
  });

  it('marks every offline reply as rule-of-thumb', () => {
    const reply = generateFallbackChatResponse('hello', { soilPH: 6.8 });
    expect(reply).toMatch(/rule-of-thumb/);
  });
});
