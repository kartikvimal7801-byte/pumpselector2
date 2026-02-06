// Function to get folder name based on pump type
function getPumpFolderName(pumpType) {
  const folderMap = {
    'Priming': 'Self Priming Pump',
    'centrifugale': 'Centrifugal Pump'
  };
  return folderMap[pumpType] || 'Self Priming Pump'; // Default to Self Priming Pump
}

// Spare parts data (default/fallback)
let sparePartsData = {
  'Priming': {
    title: 'Self Priming Mini Monoblock Pump Spares',
    table: {
      headers: ['Model', 'Casing', 'Impeller', 'Mech. Sea', 'Adaptor', 'NRV'],
      rows: [
        ['S1', 'MSPX1', 'MSPK6', 'MSPD7', 'MSPD1', 'MSPD7'],
        ['S2', 'MSPD2', 'MSPS8', 'MSPY1', 'MSPY3', 'MSPY4'],
        ['SAGAR1', 'MSPX1', 'MSPN2', 'MSPP3', 'MSPP1', 'MSPP6'],
        ['SAGAR2', 'MSPG4', 'MSPP4', 'MSPS4', 'MSPS5', 'MSPS7'],
        ['HVLO1', 'MSPT1', 'MSPJ1', 'MSPF6', 'MSPF3', 'MSPF4'],
        ['JOY1 ULTRA', 'MSPH6', 'MSPK6', 'MSPK4', 'MSPK5', 'MSPK7'],
        ['JOY2 ULTRA', 'MSPH7', 'MSPP7', 'MSPP5', 'MSPP8', 'MSPP2']
      ]
    },
    image: 'Spares_Parts/Self Priming Pump/Self-Priming-Pump1.png',
    partImages: {
      'Casing': 'Spares_Parts/Self Priming Pump/Casing.png',
      'Impeller': 'Spares_Parts/Self Priming Pump/Impeller.png',
      'Mech. Sea': 'Spares_Parts/Self Priming Pump/Mech seal.png',
      'Adaptor': 'Spares_Parts/Self Priming Pump/Adaptor.png',
      'NRV': 'Spares_Parts/Self Priming Pump/NRV.jpg'
    },
    // Unit prices for each part code (in rupees)
    prices: {
      'MSPX1': 500, 'MSPK6': 300, 'MSPD7': 400, 'MSPD1': 350, 'MSPD2': 450,
      'MSPS8': 320, 'MSPY1': 380, 'MSPY3': 420, 'MSPY4': 360, 'MSPN2': 310,
      'MSPP3': 390, 'MSPP1': 340, 'MSPP6': 370, 'MSPG4': 480, 'MSPP4': 330,
      'MSPS4': 410, 'MSPS5': 440, 'MSPS7': 400, 'MSPT1': 520, 'MSPJ1': 290,
      'MSPF6': 380, 'MSPF3': 350, 'MSPF4': 360, 'MSPH6': 550, 'MSPK4': 370,
      'MSPK5': 430, 'MSPK7': 390, 'MSPH7': 580, 'MSPP7': 340, 'MSPP5': 400,
      'MSPP8': 450, 'MSPP2': 320
    }
  },
  'centrifugale': {
    title: 'Centrifugal Pump Spares',
    table: {
      headers: ['Model', 'Casing', 'Impeller', 'Mech. Sea', 'Adaptor', 'NRV'],
      rows: [
        ['C1', 'MCPX1', 'MCPK6', 'MCPD7', 'MCPD1', 'MCPD7'],
        ['C2', 'MCPD2', 'MCPS8', 'MCPY1', 'MCPY3', 'MCPY4'],
        ['CENT1', 'MCPX1', 'MCPN2', 'MCPP3', 'MCPP1', 'MCPP6'],
        ['CENT2', 'MCPG4', 'MCPP4', 'MCPS4', 'MCPS5', 'MCPS7'],
        ['HVLC1', 'MCPT1', 'MCPJ1', 'MCPF6', 'MCPF3', 'MCPF4'],
        ['CENT1 ULTRA', 'MCPH6', 'MCPK6', 'MCPK4', 'MCPK5', 'MCPK7'],
        ['CENT2 ULTRA', 'MCPH7', 'MCPP7', 'MCPP5', 'MCPP8', 'MCPP2']
      ]
    },
    image: 'Spares_Parts/Centrifugal Pump/Centrifigle-pump.jpg',
    partImages: {
      'Casing': 'Spares_Parts/Centrifugal Pump/Casing.png',
      'Impeller': 'Spares_Parts/Centrifugal Pump/Impeller.png',
      'Mech. Sea': 'Spares_Parts/Centrifugal Pump/Mech seal.png',
      'Adaptor': 'Spares_Parts/Centrifugal Pump/Adaptor.png',
      'NRV': 'Spares_Parts/Centrifugal Pump/NRV.jpg'
    },
    // Unit prices for each part code (in rupees)
    prices: {
      'MCPX1': 550, 'MCPK6': 350, 'MCPD7': 450, 'MCPD1': 400, 'MCPD2': 500,
      'MCPS8': 370, 'MCPY1': 430, 'MCPY3': 470, 'MCPY4': 410, 'MCPN2': 360,
      'MCPP3': 440, 'MCPP1': 390, 'MCPP6': 420, 'MCPG4': 530, 'MCPP4': 380,
      'MCPS4': 460, 'MCPS5': 490, 'MCPS7': 450, 'MCPT1': 570, 'MCPJ1': 340,
      'MCPF6': 430, 'MCPF3': 400, 'MCPF4': 410, 'MCPH6': 600, 'MCPK4': 420,
      'MCPK5': 480, 'MCPK7': 440, 'MCPH7': 630, 'MCPP7': 390, 'MCPP5': 450,
      'MCPP8': 500, 'MCPP2': 370
    }
  }
  // Add more pump types here as needed
};

// Helper function to update image paths based on pump type
function updateImagePathsForPumpType(pumpType, data) {
  if (!data) return data;
  
  const folderName = getPumpFolderName(pumpType);
  const basePath = `Spares_Parts/${folderName}/`;
  
  // Update main image path
  if (data.image && !data.image.includes('Spares_Parts/')) {
    // Extract filename from path
    const imageName = data.image.split('/').pop();
    data.image = basePath + imageName;
  }
  
  // Update part images paths
  if (data.partImages) {
    Object.keys(data.partImages).forEach(partName => {
      if (data.partImages[partName] && !data.partImages[partName].includes('Spares_Parts/')) {
        const imageName = data.partImages[partName].split('/').pop();
        data.partImages[partName] = basePath + imageName;
      }
    });
  }
  
  return data;
}

// Load spare parts data from database file if assigned
async function loadSparePartsData() {
  try {
    if (typeof pumpDB !== 'undefined' && pumpDB) {
      await pumpDB.init();
      const sparesFile = await pumpDB.getDatabaseFileForSpares();
      
      if (sparesFile && sparesFile.fileData) {
        // Parse and use the database file assigned for spares
        const fileData = JSON.parse(sparesFile.fileData);
        console.log('Using database file for spares:', sparesFile.fileName);
        
        // Replace sparePartsData with data from file
        // Assuming the file structure matches sparePartsData format
        if (fileData && typeof fileData === 'object') {
          // Update image paths for each pump type
          Object.keys(fileData).forEach(pumpType => {
            fileData[pumpType] = updateImagePathsForPumpType(pumpType, fileData[pumpType]);
          });
          sparePartsData = fileData;
        }
      }
    }
  } catch (error) {
    console.warn('Could not load database file for spares, using default data:', error);
  }
}

// Load data when page loads (before other code runs)
(async () => {
  await loadSparePartsData();
})();

// Get modal elements
const sparesModal = document.getElementById('sparesModal');
const orderModal = document.getElementById('orderModal');
const closeBtn = document.querySelector('.close');
const closeOrderBtn = document.getElementById('closeOrderModal');
const sparesContent = document.getElementById('sparesContent');
const modalTitle = document.getElementById('modalTitle');

// Track selected parts and current pump type
let selectedParts = [];
let currentPumpType = '';
let currentPumpName = '';

// Map pump type to database category name
function getPumpCategoryFromType(pumpType) {
  const categoryMap = {
    'Priming': 'Self Priming Mini-Monoblock',
    'centrifugale': 'Centrifugal Pump',
    'SStage': 'Single Stage Pressure Pump',
    'MStage': 'Multi-stage Booster Pump',
    'opwell': 'Open Well submersible Pump',
    '3borwp': '3-4 inch Borewell submersible Pump',
    '6borwp': '5-6-7-8 inch Borewell submersible Pump',
    'shallow': 'Shallow Well Jet Pump',
    'deepwell': 'Deep Well Jet Pump',
    'a1sewage': 'Sewage submersible Pump',
    'circulatingpump': 'In Line Circulating Pump',
    'dewatering': 'Dewatering Submersible Pump'
  };
  return categoryMap[pumpType] || pumpType;
}

// Fixed table headers - same for all pump types
const FIXED_TABLE_HEADERS = ['Model', 'Casing', 'Impeller', 'Mech. Sea', 'Adaptor', 'NRV'];

// Map database column names to our fixed headers (case-insensitive matching)
function mapDatabaseColumnToHeader(columnName) {
  const colLower = String(columnName || '').toLowerCase().trim();
  
  if (colLower.includes('model')) return 'Model';
  if (colLower.includes('casing')) return 'Casing';
  if (colLower.includes('impeller')) return 'Impeller';
  if (colLower.includes('mech') || colLower.includes('seal')) return 'Mech. Sea';
  if (colLower.includes('adaptor') || colLower.includes('adapter')) return 'Adaptor';
  if (colLower.includes('nrv') || (colLower.includes('valve') && colLower.includes('non'))) return 'NRV';
  
  return null; // Column doesn't match any fixed header
}

// Load spare parts data from database for specific pump category
async function loadSparePartsFromDatabase(pumpCategory) {
  try {
    if (typeof pumpDB !== 'undefined' && pumpDB) {
      await pumpDB.init();
      const sparesFile = await pumpDB.getDatabaseFileForSpares();
      
      if (sparesFile && sparesFile.fileData) {
        const fileData = JSON.parse(sparesFile.fileData);
        console.log('Loading spare parts from database for category:', pumpCategory);
        console.log('File data structure:', Array.isArray(fileData) ? 'Array' : 'Object', 'Length:', Array.isArray(fileData) ? fileData.length : 'N/A');
        
        // If fileData is an array (Excel converted format: [headerObj, ...dataRows])
        if (Array.isArray(fileData) && fileData.length > 1) {
          // First element is header object with column names as keys and values
          const headerObj = fileData[0];
          const dataRows = fileData.slice(1);
          
          console.log('Header object:', headerObj);
          console.log('Data rows count:', dataRows.length);
          
          // Get all column names from header object
          const columnNames = Object.keys(headerObj);
          console.log('Column names:', columnNames);
          
          // Find category column name
          let categoryColumnName = null;
          columnNames.forEach(colName => {
            const colLower = String(colName || '').toLowerCase().trim();
            if ((colLower.includes('category') || colLower.includes('pump type') || colLower.includes('pump category')) && !categoryColumnName) {
              categoryColumnName = colName;
            }
          });
          
          if (!categoryColumnName) {
            console.warn('Category column not found in database. Available columns:', columnNames);
            return null;
          }
          
          console.log('Category column found:', categoryColumnName);
          
          // Filter rows by pump category
          const filteredRows = dataRows.filter(row => {
            const rowCategory = String(row[categoryColumnName] || '').trim();
            const matches = rowCategory === pumpCategory || rowCategory.toLowerCase() === pumpCategory.toLowerCase();
            if (matches) {
              console.log('Matched row:', row);
            }
            return matches;
          });
          
          if (filteredRows.length === 0) {
            console.warn('No spare parts found for category:', pumpCategory);
            // Show available categories for debugging
            const availableCategories = [...new Set(dataRows.map(row => String(row[categoryColumnName] || '').trim()).filter(c => c))];
            console.log('Available categories in database:', availableCategories);
            return null;
          }
          
          console.log('Filtered rows count:', filteredRows.length);
          
          // Map database column names to fixed headers
          const columnMapping = {};
          FIXED_TABLE_HEADERS.forEach(header => {
            columnNames.forEach(dbColumnName => {
              const mappedHeader = mapDatabaseColumnToHeader(dbColumnName);
              if (mappedHeader === header && !columnMapping[header]) {
                columnMapping[header] = dbColumnName;
              }
            });
          });
          
          console.log('Column mapping:', columnMapping);
          
          // Check if we found all required columns
          const missingColumns = FIXED_TABLE_HEADERS.filter(header => !columnMapping[header]);
          if (missingColumns.length > 0) {
            console.warn('Missing required columns:', missingColumns);
            console.log('Available columns:', columnNames);
            // Continue anyway, missing columns will be empty
          }
          
          // Build table rows using fixed headers
          const tableRows = filteredRows.map(row => {
            return FIXED_TABLE_HEADERS.map(header => {
              const dbColumnName = columnMapping[header];
              if (dbColumnName && row[dbColumnName] !== undefined && row[dbColumnName] !== null) {
                return String(row[dbColumnName]).trim();
              }
              return '';
            });
          });
          
          console.log('Table rows built:', tableRows.length, 'rows');
          
          // Get image paths based on pump type
          const pumpType = Object.keys(sparePartsData).find(key => {
            const category = getPumpCategoryFromType(key);
            return category === pumpCategory;
          }) || 'Priming';
          
          const folderName = getPumpFolderName(pumpType);
          const basePath = `Spares_Parts/${folderName}/`;
          
          // Fixed part images mapping
          const partImages = {
            'Casing': basePath + 'Casing.png',
            'Impeller': basePath + 'Impeller.png',
            'Mech. Sea': basePath + 'Mech seal.png',
            'Adaptor': basePath + 'Adaptor.png',
            'NRV': basePath + 'NRV.jpg'
          };
          
          // Get main pump image
          let pumpImage = basePath;
          if (pumpType === 'Priming') {
            pumpImage += 'Self-Priming-Pump1.png';
          } else if (pumpType === 'centrifugale') {
            pumpImage += 'Centrifigle-pump.jpg';
          } else {
            pumpImage += 'pump.png'; // Default fallback
          }
          
          // Build prices object from database (if price columns exist)
          const prices = {};
          columnNames.forEach(colName => {
            const colLower = String(colName || '').toLowerCase().trim();
            if (colLower.includes('price') || colLower.includes('cost')) {
              // Extract prices from filtered rows
              filteredRows.forEach(row => {
                // Try to get part code from any part column
                FIXED_TABLE_HEADERS.forEach(header => {
                  if (header !== 'Model') {
                    const partCode = row[columnMapping[header]];
                    const price = parseFloat(row[colName]) || 0;
                    if (partCode && price > 0) {
                      prices[String(partCode).trim()] = price;
                    }
                  }
                });
              });
            }
          });
          
          const result = {
            title: `${pumpCategory} Spares`,
            table: {
              headers: FIXED_TABLE_HEADERS,
              rows: tableRows
            },
            image: pumpImage,
            partImages: partImages,
            prices: prices
          };
          
          console.log('Final result:', result);
          return result;
        }
        // If fileData is an object (structured format)
        else if (typeof fileData === 'object' && !Array.isArray(fileData)) {
          // Check if it has the pump category as a key
          if (fileData[pumpCategory]) {
            const data = fileData[pumpCategory];
            // Ensure it uses fixed headers
            if (data.table && data.table.headers) {
              data.table.headers = FIXED_TABLE_HEADERS;
            }
            return updateImagePathsForPumpType(
              Object.keys(sparePartsData).find(key => getPumpCategoryFromType(key) === pumpCategory) || 'Priming',
              data
            );
          }
        } else {
          console.warn('Unexpected file data format:', typeof fileData, Array.isArray(fileData));
        }
      } else {
        console.warn('No spares file found or file data is empty');
      }
    } else {
      console.warn('pumpDB is not available');
    }
  } catch (error) {
    console.error('Error loading spare parts from database:', error);
    console.error('Error stack:', error.stack);
  }
  return null;
}

// Open modal when pump is clicked
document.querySelectorAll('.pump-type-item').forEach(item => {
  item.addEventListener('click', async () => {
    const pumpType = item.dataset.value;
    const pumpName = item.querySelector('.pump-name') ? item.querySelector('.pump-name').textContent : '';
    currentPumpName = pumpName;
    const pumpCategory = getPumpCategoryFromType(pumpType);
    await openSparesModal(pumpType, pumpCategory);
  });
});

// Close modal when X is clicked
closeBtn.addEventListener('click', () => {
  sparesModal.style.display = 'none';
  selectedParts = [];
});

closeOrderBtn.addEventListener('click', () => {
  orderModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  if (event.target === sparesModal) {
    sparesModal.style.display = 'none';
    selectedParts = [];
  }
  if (event.target === orderModal) {
    orderModal.style.display = 'none';
  }
});

async function openSparesModal(pumpType, pumpCategory = null) {
  // Try to load from database first
  let data = null;
  if (pumpCategory) {
    data = await loadSparePartsFromDatabase(pumpCategory);
  }
  
  // Fallback to default data if database doesn't have it
  if (!data) {
    data = sparePartsData[pumpType];
  }
  
  if (!data) {
    alert('Spare parts information for this pump type is coming soon!');
    return;
  }

  currentPumpType = pumpType;
  selectedParts = []; // Reset selected parts
  modalTitle.textContent = data.title;
  
  // Create table with images above column headers
  let tableHTML = '<table class="spares-table"><thead>';
  
  // First row: Images above headers (except Model column)
  tableHTML += '<tr class="image-row">';
  data.table.headers.forEach(header => {
    if (header === 'Model') {
      tableHTML += `<th class="image-header"></th>`;
    } else {
      const imagePath = data.partImages[header] || '';
      tableHTML += `<th class="image-header">
        <img src="${imagePath}" alt="${header}" class="part-image"
             onerror="this.style.display='none'">
      </th>`;
    }
  });
  tableHTML += '</tr>';
  
  // Second row: Column headers
  tableHTML += '<tr class="header-row">';
  data.table.headers.forEach(header => {
    tableHTML += `<th>${header}</th>`;
  });
  tableHTML += '</tr></thead><tbody>';

  data.table.rows.forEach(row => {
    tableHTML += '<tr>';
    row.forEach((cell, index) => {
      if (index === 0) {
        // Model name column - not selectable
        tableHTML += `<td class="model-name">${cell}</td>`;
      } else {
        // Other columns - selectable
        tableHTML += `<td class="selectable" data-part="${data.table.headers[index]}" data-code="${cell}">${cell}</td>`;
      }
    });
    tableHTML += '</tr>';
  });
  tableHTML += '</tbody></table>';

  // Add spare image
  tableHTML += `<img src="${data.image}" alt="Spare Parts Diagram" class="spare-image" onerror="this.style.display='none'">`;

  // Add to Basket button
  tableHTML += '<button class="order-button" id="addToBasketBtn" disabled>Add to Basket</button>';

  sparesContent.innerHTML = tableHTML;

  // Add click handlers for selectable cells
  document.querySelectorAll('.spares-table td.selectable').forEach(cell => {
    cell.addEventListener('click', () => {
      toggleCellSelection(cell);
    });
  });

  // Add to Basket button handler
  document.getElementById('addToBasketBtn').addEventListener('click', () => {
    openOrderModal();
  });

  sparesModal.style.display = 'block';
}

function toggleCellSelection(cell) {
  const partType = cell.dataset.part;
  const partCode = cell.dataset.code;
  const rowData = cell.parentElement;
  const modelName = rowData.querySelector('.model-name').textContent;

  if (cell.classList.contains('selected')) {
    // Deselect
    cell.classList.remove('selected');
    selectedParts = selectedParts.filter(p => !(p.type === partType && p.code === partCode && p.model === modelName));
  } else {
    // Select this cell (no restrictions - allow multiple selections)
    cell.classList.add('selected');
    const data = sparePartsData[currentPumpType];
    const unitPrice = data && data.prices && data.prices[partCode] ? data.prices[partCode] : 0;
    selectedParts.push({ type: partType, code: partCode, model: modelName, quantity: 1, unitPrice: unitPrice });
  }

  // Enable/disable Add to Basket button
  const addToBasketBtn = document.getElementById('addToBasketBtn');
  if (addToBasketBtn) {
    if (selectedParts.length > 0) {
      addToBasketBtn.disabled = false;
    } else {
      addToBasketBtn.disabled = true;
    }
  }
}

function openOrderModal() {
  const data = sparePartsData[currentPumpType];
  if (!data) return;

  let orderHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h3 style="color: #003366; margin-bottom: 15px;">Order Summary</h3>
      <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #003366;">
        <p style="color: #003366; font-size: 1.1em; font-weight: bold; margin: 0;">
          Pump Type: <span style="color: #28a745;">${currentPumpName || data.title}</span>
        </p>
      </div>
      <p style="color: #666; font-size: 0.9em;">Review your selected spare parts below</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="color: #003366; margin-bottom: 15px;">Selected Parts:</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #003366; color: white;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Model</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Part Type</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Part Code</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Unit Price</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Total Price</th>
          </tr>
        </thead>
        <tbody>
  `;

  selectedParts.forEach((part, index) => {
    const partId = `part-${index}`;
    const unitPrice = part.unitPrice || 0;
    const quantity = part.quantity || 1;
    const totalPrice = unitPrice * quantity;
    orderHTML += `
      <tr style="background: ${index % 2 === 0 ? '#fff' : '#f8f9fa'};" data-part-id="${partId}">
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #003366;">${part.model || ''}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #003366;">${part.type}</td>
        <td style="padding: 10px; border: 1px solid #ddd; color: #28a745; font-weight: bold;">${part.code}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #003366;">
          ₹${unitPrice.toLocaleString('en-IN')}
        </td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
          <div class="quantity-controls">
            <button class="qty-btn qty-decrease" onclick="changeQuantity(${index}, -1)" type="button">−</button>
            <input type="number" class="qty-input" id="qty-${index}" value="${quantity}" min="1" 
                   onchange="updateQuantity(${index}, this.value)">
            <button class="qty-btn qty-increase" onclick="changeQuantity(${index}, 1)" type="button">+</button>
          </div>
        </td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #28a745;">
          ₹<span id="total-${index}">${totalPrice.toLocaleString('en-IN')}</span>
        </td>
      </tr>
    `;
  });

  orderHTML += `
        </tbody>
      </table>
    </div>
  `;

  // Add spare part images
  if (data.partImages) {
    const diagramTitle = currentPumpName ? `${currentPumpName} Diagram` : 'Spare Parts Diagram';
    orderHTML += `
      <div style="margin-top: 30px;">
        <h4 style="color: #003366; margin-bottom: 15px; text-align: center;">${diagramTitle}</h4>
        <div style="display: flex; justify-content: center; align-items: center; margin: 20px 0;">
          <img src="${data.image}" alt="${diagramTitle}" 
               style="max-width: 100%; max-height: 400px; border: 2px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
               onerror="this.style.display='none'">
        </div>
      </div>
    `;
  }

  // Add contact information and order button
  orderHTML += `
    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
      <h4 style="color: #003366; margin-bottom: 10px;">Contact for Order</h4>
      <p style="font-size: 1.1em; color: #cc5500; font-weight: bold; margin: 10px 0;">
        📞 Service Support: <a href="tel:9873441650" style="color: #cc5500; text-decoration: none;">9873441650</a>
      </p>
      <p style="color: #666; font-size: 0.9em; margin-top: 10px;">
        Please contact us with the part codes and quantities listed above to place your order.
      </p>
      <button class="order-button" onclick="window.location.href='tel:9873441650'" 
              style="margin-top: 15px; background-color: #28a745;">
        📞 Place Order
      </button>
    </div>
  `;

  document.getElementById('orderContent').innerHTML = orderHTML;
  orderModal.style.display = 'block';
}

// Quantity control functions
function changeQuantity(index, change) {
  if (selectedParts[index]) {
    const currentQty = selectedParts[index].quantity || 1;
    const newQty = Math.max(1, currentQty + change);
    selectedParts[index].quantity = newQty;
    
    const qtyInput = document.getElementById(`qty-${index}`);
    if (qtyInput) {
      qtyInput.value = newQty;
    }
    
    // Update total price
    updateTotalPrice(index);
  }
}

function updateQuantity(index, value) {
  if (selectedParts[index]) {
    const qty = Math.max(1, parseInt(value) || 1);
    selectedParts[index].quantity = qty;
    
    const qtyInput = document.getElementById(`qty-${index}`);
    if (qtyInput) {
      qtyInput.value = qty;
    }
    
    // Update total price
    updateTotalPrice(index);
  }
}

function updateTotalPrice(index) {
  if (selectedParts[index]) {
    const part = selectedParts[index];
    const unitPrice = part.unitPrice || 0;
    const quantity = part.quantity || 1;
    const totalPrice = unitPrice * quantity;
    
    const totalElement = document.getElementById(`total-${index}`);
    if (totalElement) {
      totalElement.textContent = totalPrice.toLocaleString('en-IN');
    }
  }
}

