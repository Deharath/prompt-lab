// Debug script to test ApiClient
import { ApiClient } from './api.js';

console.log('ApiClient:', ApiClient);
console.log('ApiClient.listJobs:', ApiClient.listJobs);
console.log('makeRequest method:', (ApiClient as any).makeRequest);

// Test the listJobs method
(async () => {
  try {
    const jobs = await ApiClient.listJobs();
    console.log('Jobs loaded successfully:', jobs);
  } catch (error) {
    console.error('Error loading jobs:', error);
  }
})();
