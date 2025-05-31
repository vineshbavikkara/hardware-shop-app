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

// Load Ben Details
async function loadBenDetails() {
  const benData = await fetchSheetData('BenDetails');
  const tbody = document.querySelector('#benTable tbody');
  
  tbody.innerHTML = benData.map(ben => `
    <tr>
      <td>${ben.BenName || ''}</td>
      <td>${ben.BenAcNumber || ''}</td>
      <td>${ben.BenIFSC || ''}</td>
      <td>${ben.BenBankBranch || ''}</td>
    </tr>
  `).join('');
}

// Save Ben Details
document.getElementById('benForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const ifsc = document.getElementById('benIFSC').value.toUpperCase();
  if (!/^[A-Z0-9]{11}$/.test(ifsc)) {
    alert('IFSC must be exactly 11 uppercase alphanumeric characters');
    return;
  }
  
  const benData = {
    BenName: document.getElementById('benName').value,
    BenAcNumber: document.getElementById('benAcNumber').value,
    BenIFSC: ifsc,
    BenBankBranch: document.getElementById('benBankBranch').value
  };
  
  const success = await saveToSheet('BenDetails', benData);
  if (success) {
    alert('Beneficiary added successfully!');
    loadBenDetails();
    document.getElementById('benForm').reset();
  }
});

// Load on page load
document.addEventListener('DOMContentLoaded', loadBenDetails);

// Load Purchase Details and Ben Names
async function loadPurchasePage() {
  const [purchases, benData] = await Promise.all([
    fetchSheetData('PurchaseDetails'),
    fetchSheetData('BenDetails')
  ]);
  
  // Populate Ben Name dropdown
  const benSelect = document.getElementById('benName');
  benSelect.innerHTML = '<option value="">Select Beneficiary</option>' + 
    benData.map(ben => `<option value="${ben.BenName}">${ben.BenName}</option>`).join('');
  
  // Display purchase table
  const tbody = document.querySelector('#purchaseTable tbody');
  tbody.innerHTML = purchases.map(p => `
    <tr>
      <td>${p.InvoiceDate || ''}</td>
      <td>${p.InvoiceNumber || ''}</td>
      <td>${p.BenName || ''}</td>
      <td>${p.TaxableAmount || ''}</td>
      <td>${p.CGST || ''}%</td>
      <td>${p.SGST || ''}%</td>
      <td>${p.NetAmount || ''}</td>
    </tr>
  `).join('');
}

// Save Purchase
document.getElementById('purchaseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const purchaseData = {
    InvoiceDate: document.getElementById('invoiceDate').value,
    InvoiceNumber: document.getElementById('invoiceNumber').value,
    BenName: document.getElementById('benName').value,
    TaxableAmount: parseFloat(document.getElementById('taxableAmount').value),
    CGST: parseFloat(document.getElementById('cgst').value),
    SGST: parseFloat(document.getElementById('sgst').value),
    NetAmount: parseFloat(document.getElementById('netAmount').value)
  };
  
  // Check for duplicate
  const originalDate = await checkDuplicatePurchase(purchaseData);
  if (originalDate) {
    if (!confirm(`Warning: Similar entry exists from ${originalDate}. Continue anyway?`)) {
      return;
    }
  }
  
  const success = await saveToSheet('PurchaseDetails', purchaseData);
  if (success) {
    alert('Purchase added successfully!');
    loadPurchasePage();
    document.getElementById('purchaseForm').reset();
  }
});

// Auto-calculate net amount
document.getElementById('taxableAmount').addEventListener('input', calculateNetAmount);
document.getElementById('cgst').addEventListener('input', calculateNetAmount);
document.getElementById('sgst').addEventListener('input', calculateNetAmount);

function calculateNetAmount() {
  const taxable = parseFloat(document.getElementById('taxableAmount').value) || 0;
  const cgst = parseFloat(document.getElementById('cgst').value) || 0;
  const sgst = parseFloat(document.getElementById('sgst').value) || 0;
  
  const gstAmount = taxable * (cgst + sgst) / 100;
  document.getElementById('netAmount').value = (taxable + gstAmount).toFixed(2);
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadPurchasePage);


