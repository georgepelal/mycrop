import { describe, it, expect } from 'vitest';
import {
  locationParams,
  parseLocation,
  toolHref,
} from '../src/tools/locationContextValue';

// A tool plus its location has to survive a copy-paste into someone else's
// browser, which means the URL is the source of truth and it round-trips.
describe('location in the URL', () => {
  const volos = { lat: 39.3621, lng: 22.9422, label: 'Volos' };

  it('round-trips a location through URL params', () => {
    const params = locationParams(volos);
    const back = parseLocation(params.lat, params.lng, params.place);
    expect(back).not.toBeNull();
    expect(back!.lat).toBeCloseTo(volos.lat, 4);
    expect(back!.lng).toBeCloseTo(volos.lng, 4);
    expect(back!.label).toBe('Volos');
  });

  it('survives a location with no name', () => {
    const params = locationParams({ lat: 39.5, lng: 22.5, label: '' });
    expect(params.place).toBeUndefined();
    expect(parseLocation(params.lat, params.lng, null)).toEqual({
      lat: 39.5,
      lng: 22.5,
      label: '',
    });
  });

  it('builds a shareable tool link carrying the location', () => {
    const href = toolHref('frost-freeze-risk', volos);
    expect(href.startsWith('/tools/frost-freeze-risk?')).toBe(true);
    const query = new URLSearchParams(href.split('?')[1]);
    expect(query.get('place')).toBe('Volos');
    expect(Number(query.get('lat'))).toBeCloseTo(39.3621, 4);
  });

  it('falls back to a bare tool link when nowhere is chosen', () => {
    expect(toolHref('frost-freeze-risk', null)).toBe('/tools/frost-freeze-risk');
  });

  // No default city: the old code shipped New York to a user in Greece.
  it('treats missing or nonsense coordinates as no location, never a default', () => {
    expect(parseLocation(null, null, null)).toBeNull();
    expect(parseLocation('39.4', null, null)).toBeNull();
    expect(parseLocation('not-a-number', '22.9', null)).toBeNull();
    expect(parseLocation('', '', null)).toBeNull();
  });

  it('rejects coordinates outside the globe', () => {
    expect(parseLocation('91', '0', null)).toBeNull();
    expect(parseLocation('-91', '0', null)).toBeNull();
    expect(parseLocation('0', '181', null)).toBeNull();
    expect(parseLocation('0', '-181', null)).toBeNull();
    expect(parseLocation('90', '180', null)).not.toBeNull();
  });
});
