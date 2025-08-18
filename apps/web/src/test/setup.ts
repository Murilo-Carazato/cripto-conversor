import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';
// Ensure clean localStorage for each test
beforeEach(() => {
  localStorage.clear();
});
