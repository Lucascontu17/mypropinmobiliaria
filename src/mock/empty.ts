// Mock de @elysiajs/eden para rama MOCK
import { mockEden } from "./eden-mock";

export function treaty<T>(_url: string, _config?: unknown): T {
  return mockEden as unknown as T;
}