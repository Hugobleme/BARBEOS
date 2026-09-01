import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvailabilityService } from '../../src/services/availability.service';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  beforeEach(() => {
    service = new AvailabilityService();
    vi.resetAllMocks();
  });

  const mockSupabase = (shopHours: any[], proHours: any[], timeOffs: any[], conflicts: any[]) => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'barbershop_business_hours') {
        return { select: () => ({ eq: () => ({ eq: vi.fn().mockResolvedValue({ data: shopHours, error: null }) }) }) };
      }
      if (table === 'professionals') {
        return { select: () => ({ eq: () => ({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'pro1' }], error: null }) }) }) };
      }
      if (table === 'working_hours') {
        return { select: () => ({ in: () => ({ eq: vi.fn().mockResolvedValue({ data: proHours, error: null }) }) }) };
      }
      if (table === 'time_off') {
        return { select: () => ({ in: vi.fn().mockResolvedValue({ data: timeOffs, error: null }) }) };
      }
      return { select: vi.fn() };
    });

    (supabase.rpc as any).mockResolvedValue({ data: conflicts, error: null });
  };

  it('1. Closed day returns zero slots (Empty business hours returns a clear setup state)', async () => {
    mockSupabase([], [], [], []);
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({ barbershopId: 'shop1', date, durationMinutes: 30 });
    expect(result.times).toEqual([]);
  });

  it('2. One open interval returns slots only within the interval', async () => {
    mockSupabase([
      { opens_at: '09:00:00', closes_at: '10:00:00' }
    ], [], [], []);
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({ barbershopId: 'shop1', date, durationMinutes: 30 });
    expect(result.times).toEqual(['09:00', '09:30']);
  });

  it('3. Service duration cannot extend past closing', async () => {
    mockSupabase([
      { opens_at: '09:00:00', closes_at: '09:45:00' }
    ], [], [], []);
    const date = addDays(new Date(), 1);
    // 60 minutes duration can't fit in 45 mins
    const result = await service.getAvailableSlots({ barbershopId: 'shop1', date, durationMinutes: 60 });
    expect(result.times).toEqual([]);
  });

  it('4. Existing appointment blocks overlapping slots', async () => {
    mockSupabase([
      { opens_at: '09:00:00', closes_at: '10:00:00' }
    ], [], [], [
      { professional_id: 'pro1', scheduled_start: `${format(addDays(new Date(), 1), 'yyyy-MM-dd')}T09:30:00`, scheduled_end: `${format(addDays(new Date(), 1), 'yyyy-MM-dd')}T10:00:00` }
    ]);
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({ barbershopId: 'shop1', professionalId: 'pro1', date, durationMinutes: 30 });
    expect(result.times).toEqual(['09:00']); // 09:30 is blocked
  });

  it('7. Past date returns empty slots', async () => {
    mockSupabase([{ opens_at: '09:00:00', closes_at: '10:00:00' }], [], [], []);
    const date = addDays(new Date(), -1);
    const result = await service.getAvailableSlots({ barbershopId: 'shop1', date, durationMinutes: 30 });
    expect(result.times).toEqual([]);
  });
});
