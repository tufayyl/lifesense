// Shared Supabase client initialization
// This ensures only one Supabase client instance is created across all scripts

(function() {
  'use strict';
  
  // Supabase configuration
  const SUPABASE_URL = "https://bbrleisgatjcrlnxatcc.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicmxlaXNnYXRqY3JsbnhhdGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1OTE1NTYsImV4cCI6MjA3ODE2NzU1Nn0.r1YvySsMPFoMZMLhkTNQmDotbL6eIWUoaWN3xv91TuI";
  
  // Initialize Supabase client only once
  function initSupabase() {
    if (typeof window.supabase === 'undefined') {
      console.warn('Supabase library not loaded yet');
      return null;
    }
    
    // Check if client already exists
    if (window.supabaseClient) {
      return window.supabaseClient;
    }
    
    // Create single shared client instance
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Shared Supabase client initialized');
    return window.supabaseClient;
  }
  
  // Wait for Supabase library to load, then initialize
  function waitForSupabase() {
    if (typeof window.supabase !== 'undefined') {
      initSupabase();
    } else {
      setTimeout(waitForSupabase, 100);
    }
  }
  
  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForSupabase);
  } else {
    waitForSupabase();
  }
})();

