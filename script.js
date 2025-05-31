// Google Sheets API setup
const scriptURL = 'https://script.google.com/macros/s/AKfycbwWlOQkQQgMO5A7tCMjl1sn6gfuGEFu6lrhx80wrf5C8C56351AYk1yCOC7FHGEhMC5Nw/exec'; // You'll need to create this

// Load data from Google Sheets
async function loadData(sheetName) {
    const response = await fetch(`${scriptURL}?sheet=${sheetName}`);
    return await response.json();
}

// Save data to Google Sheets
async function saveData(sheetName, data) {
    const response = await fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sheet: sheetName,
            data: data
        })
    });
    return await response.json();
}

// Ben Details Page
if (document.getElementById('benForm')) {
    document.getElementById('benForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate IFSC (11 chars, uppercase alphanumeric)
        const ifsc = document.getElementById('benIFSC').value;
        if (!/^[A-Z0-9]{11}$/.test(ifsc)) {
            alert('IFSC must be exactly 11 uppercase alphanumeric characters');
            return;
        }
        
        // Save data
        const benData = {
            BenName: document.getElementById('benName').value,
            BenAcNumber: document.getElementById('benAcNumber').value,
            BenIFSC: ifsc,
            BenBankBranch: document.getElementById('benBankBranch').value
        };
        
        await saveData('BenDetails', benData);
        loadBenDetails();
    });
    
    async function loadBenDetails() {
        const data = await loadData('BenDetails');
        const tbody = document.querySelector('#benTable tbody');
        tbody.innerHTML = data.map(row => `
            <tr>
                <td>${row.BenName}</td>
                <td>${row.BenAcNumber}</td>
                <td>${row.BenIFSC}</td>
                <td>${row.BenBankBranch}</td>
            </tr>
        `).join('');
    }
    
    loadBenDetails();
}

// Similar implementations for other pages...