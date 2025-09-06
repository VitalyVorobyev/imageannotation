const env = (typeof import.meta !== 'undefined' && (import.meta as { env: Record<string, string> }).env) || (process.env as Record<string, string>);
export const IMAGE_STORE_SERVICE_URL = env.VITE_IMAGE_STORE_SERVICE_URL ?? 'http://localhost:8000';
export const FEATURE_DETECTION_SERVICE_URL = env.VITE_FEATURE_DETECTION_SERVICE_URL ?? 'http://localhost:8001';
