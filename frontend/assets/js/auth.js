import { supabase } from './supabase-client.js';

// Check authentication status and update UI
async function checkAuthAndUpdateUI() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const loginButton = document.getElementById('loginButton');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userDropdown = document.getElementById('userDropdown');

    if (!loginButton || !userProfile || !userName) return; // Skip if elements don't exist

    if (user && session) {
      // User is logged in
      loginButton.classList.add('d-none');
      userProfile.classList.remove('d-none');
      if (userDropdown) userDropdown.classList.remove('d-none');

      // Get user profile data
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (data && data.full_name) {
          userName.textContent = data.full_name;
        } else {
          userName.textContent = user.email;
        }

        // Update navigation based on user role
        if (data.role === 'agent') {
          const agentNav = document.getElementById('agentNav');
          if (agentNav) agentNav.classList.remove('d-none');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        userName.textContent = user.email;
      }
    } else {
      // User is not logged in
      loginButton.classList.remove('d-none');
      userProfile.classList.add('d-none');
      if (userDropdown) userDropdown.classList.add('d-none');

      // Hide role-specific navigation
      const agentNav = document.getElementById('agentNav');
      if (agentNav) agentNav.classList.add('d-none');

      // Redirect to login if on protected page
      const protectedPages = ['profile.html', 'my-orders.html', 'my-donations.html'];
      const currentPage = window.location.pathname.split('/').pop();
      if (protectedPages.includes(currentPage)) {
        window.location.href = 'login.html';
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
    // Handle error gracefully - show error message to user if needed
  }
}

// Handle logout
async function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Clear any stored auth state
        localStorage.removeItem('supabase.auth.token');
        
        // Redirect to home page
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
      }
    });
  }
}

// Initialize auth checking
document.addEventListener('DOMContentLoaded', () => {
  checkAuthAndUpdateUI();
  setupLogout();
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      checkAuthAndUpdateUI();
    }
  });
}); 