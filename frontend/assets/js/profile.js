import { supabase } from './supabase-client.js';

// Load profile data
async function loadProfile() {
  try {
    // Show loading state
    setLoadingState(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create one with user metadata
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert([{
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          email: user.email,
          role: user.user_metadata?.role || 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) throw createError;
      updateProfileDisplay(newProfile, user);
    } else if (profileError) {
      throw profileError;
    } else {
      updateProfileDisplay(profile, user);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showError('Failed to load profile. Please try again later.');
  } finally {
    setLoadingState(false);
  }
}

// Update profile display
function updateProfileDisplay(profile, user) {
  if (!profile || !user) return;

  // Update header name
  const userNameElement = document.getElementById('userName');
  if (userNameElement) {
    userNameElement.textContent = profile.full_name || user.email;
  }
  
  // Update profile card
  const profileNameElement = document.getElementById('profileName');
  const profileEmailElement = document.getElementById('profileEmail');
  
  if (profileNameElement) {
    profileNameElement.textContent = profile.full_name || 'Not set';
  }
  if (profileEmailElement) {
    profileEmailElement.textContent = user.email;
  }
  
  // Update form fields
  const formFields = {
    'fullName': profile.full_name || '',
    'email': user.email,
    'role': profile.role || 'user',
  };

  Object.entries(formFields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
    }
  });
}

function setLoadingState(isLoading) {
  const elements = ['fullName', 'email', 'role'];
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.disabled = isLoading;
    }
  });
}

function showError(message) {
  const cardBody = document.querySelector('.card-body');
  const profileForm = document.getElementById('profileForm');
  
  if (!cardBody || !profileForm) return;
  
  // Remove any existing error messages
  const existingErrors = cardBody.querySelectorAll('.alert-danger');
  existingErrors.forEach(error => error.remove());
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger';
  errorDiv.textContent = message;
  
  cardBody.insertBefore(errorDiv, profileForm);
}

// Handle edit mode
function setupEditMode() {
  const editProfileBtn = document.getElementById('editProfileBtn');
  const editButtons = document.getElementById('editButtons');
  const cancelEditBtn = document.getElementById('cancelEdit');
  const profileForm = document.getElementById('profileForm');

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      const formInputs = document.querySelectorAll('#profileForm input:not([id="email"]):not([id="role"])');
      formInputs.forEach(input => input.disabled = false);
      editButtons.style.display = 'block';
      editProfileBtn.style.display = 'none';
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      const formInputs = document.querySelectorAll('#profileForm input');
      formInputs.forEach(input => input.disabled = true);
      editButtons.style.display = 'none';
      editProfileBtn.style.display = 'inline-block';
      loadProfile(); // Reload original data
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) return;

        const updates = {
          id: user.id,
          full_name: document.getElementById('fullName').value.trim(),
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('profiles')
          .upsert(updates);

        if (updateError) throw updateError;

        // Reset form state
        const formInputs = document.querySelectorAll('#profileForm input');
        formInputs.forEach(input => input.disabled = true);
        editButtons.style.display = 'none';
        editProfileBtn.style.display = 'inline-block';

        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.textContent = 'Profile updated successfully!';
        document.querySelector('.card-body').insertBefore(successDiv, profileForm);

        // Reload profile data
        loadProfile();
      } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile. Please try again later.');
      }
    });
  }
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  setupEditMode();
}); 