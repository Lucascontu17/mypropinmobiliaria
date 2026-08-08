export const IS_MOCK = true;
export const MOCK_DELAY_MS = 400;
export const delay = (ms = MOCK_DELAY_MS) => new Promise(resolve => setTimeout(resolve, ms));