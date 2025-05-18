// Modal Functionality Test
// Run in browser console when on the Food Index page

(function testAddFoodButtonAndModal() {
  console.log('=== STARTING MODAL TEST ===');
  
  // Check if we're on the food index page
  const addButton = document.querySelector('.food-index-page .add-button');
  if (!addButton) {
    console.error('Test failed: Add button not found. Are you on the Food Index page?');
    return;
  }
  
  console.log('Found Add New Food button');
  
  // Click the button
  console.log('Simulating click on Add New Food button...');
  addButton.click();
  
  // Wait for modal to appear
  setTimeout(() => {
    console.log('Checking if modal appeared...');
    
    // Check for modal root
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      console.error('Test failed: Modal root element not found');
      return;
    }
    
    console.log('Modal root element found');
    
    // Check for modal overlay
    const modalOverlay = modalRoot.querySelector('.modal-overlay');
    if (!modalOverlay) {
      console.error('Test failed: Modal overlay not found');
      return;
    }
    
    console.log('Modal overlay found');
    
    // Check for modal title
    const modalTitle = modalRoot.querySelector('.modal-title');
    if (!modalTitle) {
      console.error('Test failed: Modal title not found');
      return;
    }
    
    console.log(`Modal title found: "${modalTitle.textContent}"`);
    
    // Test passed
    console.log('=== TEST PASSED: Modal opened successfully ===');
    
    // Optional: Close the modal
    const closeButton = modalRoot.querySelector('.modal-close-button');
    if (closeButton) {
      console.log('Closing modal...');
      closeButton.click();
    }
  }, 500);
})(); 