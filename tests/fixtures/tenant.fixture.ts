/**
 * E2E Test Fixtures and Environment Configuration
 *
 * Rules:
 * - Deterministic and isolated by tenant.
 * - Non-production test slug default: "e2e-barbeos-test".
 * - Reads test-only environment variables.
 * - Does NOT hardcode production customer or appointment data.
 */

export interface TestTenantConfig {
  shopSlug: string;
  shopId?: string;
  professionalId?: string;
  serviceId?: string;
  ownerEmail?: string;
  ownerPassword?: string;
  customerEmail?: string;
  customerPassword?: string;
  isWritableEnv: boolean;
}

export const E2E_CONFIG: TestTenantConfig = {
  shopSlug: process.env.E2E_TEST_SHOP_SLUG || "e2e-barbeos-test",
  shopId: process.env.E2E_TEST_SHOP_ID,
  professionalId: process.env.E2E_TEST_PROFESSIONAL_ID,
  serviceId: process.env.E2E_TEST_SERVICE_ID,
  ownerEmail: process.env.E2E_OWNER_EMAIL,
  ownerPassword: process.env.E2E_OWNER_PASSWORD,
  customerEmail: process.env.E2E_CUSTOMER_EMAIL,
  customerPassword: process.env.E2E_CUSTOMER_PASSWORD,
  isWritableEnv: process.env.E2E_WRITABLE_ENV === "true",
};

/**
 * Returns a future weekday (Monday = 1, ..., Friday = 5) formatted as YYYY-MM-DD
 * to guarantee tests run on business days and avoid past-date rejections.
 */
export function getFutureTestDate(daysInFuture = 7): {
  date: Date;
  dateString: string;
  dayNumber: number;
} {
  const d = new Date();
  d.setDate(d.getDate() + daysInFuture);

  // Ensure it lands on a weekday (Wednesday = 3 if weekend)
  const day = d.getDay();
  if (day === 0) {
    d.setDate(d.getDate() + 3); // Move from Sunday to Wednesday
  } else if (day === 6) {
    d.setDate(d.getDate() + 4); // Move from Saturday to Wednesday
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return {
    date: d,
    dateString: `${yyyy}-${mm}-${dd}`,
    dayNumber: d.getDate(),
  };
}

export interface MockFixtureData {
  shopName: string;
  proName: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  businessHours: {
    opensAt: string;
    closesAt: string;
  };
  workingHours: {
    startTime: string;
    endTime: string;
    breakStart: string;
    breakEnd: string;
  };
}

export const MOCK_FIXTURE_DATA: MockFixtureData = {
  shopName: "Barbearia E2E Teste",
  proName: "Barbeiro Teste",
  serviceName: "Corte Tradicional E2E",
  servicePrice: 45.0,
  serviceDuration: 30,
  businessHours: {
    opensAt: "09:00",
    closesAt: "19:00",
  },
  workingHours: {
    startTime: "09:00",
    endTime: "18:00",
    breakStart: "12:00",
    breakEnd: "13:00",
  },
};
