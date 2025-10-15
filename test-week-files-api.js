// Test script to check the week-files API endpoint
// Run this in browser console or as a Node.js script

const testWeekFilesAPI = async () => {
  try {
    console.log('Testing week-files API endpoint...');
    
    // Test with different user profiles
    const testProfiles = [
      { role_type: 'medical_student', university: 'ARU', study_year: '5' },
      { role_type: 'foundation_doctor', foundation_year: 'FY1' },
      { role_type: 'admin' },
      {} // No profile
    ];
    
    for (const profile of testProfiles) {
      console.log(`\n--- Testing with profile:`, profile);
      
      const params = new URLSearchParams();
      if (profile.role_type) params.append('role_type', profile.role_type);
      if (profile.university) params.append('university', profile.university);
      if (profile.study_year) params.append('study_year', profile.study_year);
      if (profile.foundation_year) params.append('foundation_year', profile.foundation_year);
      
      const url = `/api/resources/week-files?${params.toString()}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      console.log('Files count:', data.files?.length || 0);
      
      if (data.files && data.files.length > 0) {
        console.log('Sample file:', data.files[0]);
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

// If running in browser console
if (typeof window !== 'undefined') {
  testWeekFilesAPI();
} else {
  // If running as Node.js script
  console.log('This script should be run in the browser console to test the API');
}
