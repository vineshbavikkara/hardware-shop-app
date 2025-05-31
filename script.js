 // Replace with your deployed Apps Script URL
const scriptURL = 'https://script.google.com/macros/s/AKfycbwob95Qd1kEWzVgmXbaL17ndEel4L0-hnswkx6o80OtroeES4pWphuqeMFcN9Evz00b/exec';

// Generic function to fetch data
async function fetchSheetData(sheetName) {
  try {
    const response = await fetch(`${scriptURL}?sheet=${sheetName}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

// Generic function to save data
async function saveToSheet(sheetName, data) {
  try {
    const response = await fetch(scriptURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sheet: sheetName, data })
    });
    
    const result = await response.json();
    
    if (result.error === 'Duplicate entry') {
      alert(`Warning: This entry already exists (originally entered on ${result.originalDate}). Please verify if you need to add it again.`);
      return false;
    }
    
    return result.success;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

// Check for duplicate payment before saving
async function checkDuplicatePayment(paymentData) {
  try {
    const response = await fetch(`${scriptURL}?action=checkDuplicate&sheet=PaymentDetails&benName=${encodeURIComponent(paymentData.BenName)}&amount=${paymentData.PaymentAmount}`);
    const result = await response.json();
    return result.originalDate || false;
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return false;
  }
}

// Check for duplicate purchase before saving
async function checkDuplicatePurchase(purchaseData) {
  try {
    const response = await fetch(`${scriptURL}?action=checkDuplicate&sheet=PurchaseDetails&invoiceNumber=${encodeURIComponent(purchaseData.InvoiceNumber)}&amount=${purchaseData.NetAmount}`);
    const result = await response.json();
    return result.originalDate || false;
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return false;
  }
}
