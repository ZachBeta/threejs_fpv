import { TextDecoder, TextEncoder } from 'util';
import fetch from 'node-fetch';

// Add TextDecoder and TextEncoder to global scope
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

// Mock fetch for API tests
global.fetch = fetch; 