document.addEventListener('DOMContentLoaded', () => {
  console.log('JS Loaded'); // Debug: Confirms script runs

  // 🛠️ Element References (robust selectors with fallbacks and null checks)
  const simpleMode = document.getElementById('simpleMode');
  const advancedMode = document.getElementById('advancedMode');
  const simpleBtn = document.getElementById('simpleBtn');
  const advancedBtn = document.getElementById('advancedBtn');
  const form = document.getElementById('pumpForm');
  const resultBox = document.getElementById('resultBox');
 
  

  const purposeSelect = document.getElementById('purpose') || document.querySelector('select[name="purpose"]');
  const allPurposeSelects = Array.from(document.querySelectorAll('select[name="purpose"], #purpose'));
  const locationSelect = document.querySelector('select[name="location"]');
  const sourceSelect = document.getElementById('sourceSelect') || document.querySelector('select[name="source"]');
  const constructionSourceSelect = document.getElementById('constructionSourceSelect');
  const constructionSourceLabel = document.getElementById('constructionSourceLabel');
  const waterLevelSelect = document.getElementById('waterLevelSelect') || document.querySelector('select[name="waterLevel"]');
  const waterLevelLabel = waterLevelSelect ? waterLevelSelect.previousElementSibling : document.querySelector('label[for="waterLevelSelect"]');
  const deliverySelect = document.getElementById('deliverySelect') || document.querySelector('select[name="delivery"]');
  const deliveryLabel = deliverySelect ? deliverySelect.previousElementSibling : document.querySelector('label[for="deliverySelect"]') || null;
  const heightDropdownBox = document.getElementById('heightDropdownBox');

  // 🎚️ Toggle Pump Stages visibility based on purpose + location
  function togglePumpStages() {
    const borewellOptions = ['3borwp', '4borwp', '5borwp', '6borwp', '7borwp', '8borwp'];
    const isBorewell = borewellOptions.includes(getCurrentPurposeValue());
    const isMultiStage = locationSelect?.value === 'MStage';
    const stageBox = document.getElementById('stageBox');

    if (stageBox) {
      stageBox.style.display = (isBorewell && isMultiStage) ? 'block' : 'none';
    }
  }
  // Helper: get current visible purpose value (handles duplicate selects in Simple/Advanced)
  function getCurrentPurposeValue() {
    const visiblePurpose = allPurposeSelects.find(sel => sel && sel.offsetParent !== null);
    const value = (visiblePurpose || purposeSelect)?.value || '';
    return value.toLowerCase();
  }

  
  
  // Robust usage targeting (for hiding) - Add id="usageSelect" to HTML for best results
  const usageSelect = document.getElementById('usageSelect') || document.querySelector('select[name="usage"]');
  const usageLabel = document.querySelector('label[for="usageSelect"]') || (usageSelect ? usageSelect.previousElementSibling : null);
  
  const phaseSelect = document.querySelector('select[name="phase"]');
  const qualitySelect = document.querySelector('select[name="quality"]');

  // Debug log (remove after testing)
  console.log('Purpose Select Found:', purposeSelect);
  console.log('Source Select Found:', sourceSelect);
  console.log('Water Level Select Found:', waterLevelSelect);
  console.log('Usage Select Found:', usageSelect);

  // 📊 Real Pump Database from JSON
  let pumpDatabase = [];
  let combinationDatabase = []; // For exact combination matching
  let valueMappings = {}; // Auto-generated mappings from Excel file

  // Load pump data from database file assigned for selection
  async function loadPumpData() {
    try {
      let data = null;
      
      // Wait for pumpDB to be available
      let retries = 0;
      while (typeof pumpDB === 'undefined' && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      // Get database file assigned for selection from IndexedDB
      try {
        if (typeof pumpDB !== 'undefined' && pumpDB) {
          console.log('Initializing database...');
          await pumpDB.init();
          console.log('Database initialized, fetching selection file...');
          
          const selectionFile = await pumpDB.getDatabaseFileForSelection();
          console.log('Selection file result:', selectionFile ? 'Found' : 'Not found');
          
          if (selectionFile) {
            console.log('File details:', {
              id: selectionFile.id,
              fileName: selectionFile.fileName,
              hasData: !!selectionFile.fileData,
              forSelection: selectionFile.forSelection,
              dataLength: selectionFile.fileData ? selectionFile.fileData.length : 0
            });
            
            if (selectionFile.fileData) {
              // Use database file assigned for selection
              try {
                data = JSON.parse(selectionFile.fileData);
                console.log('Successfully parsed JSON. Rows:', data ? data.length : 0);
                console.log('Using database file for selection:', selectionFile.fileName);
                
                // Check if this is a combination-based file (has Model Name column)
                if (data && data.length > 0) {
                  const firstRow = data[0];
                  const allKeys = Object.keys(firstRow);
                  
                  // Check for model name column (case-insensitive)
                  let hasModelName = allKeys.some(key => {
                    const lowerKey = key.toLowerCase().trim();
                    return lowerKey === 'model name' || 
                           lowerKey === 'modelname' ||
                           lowerKey === 'model' ||
                           lowerKey === 'pump model' ||
                           lowerKey === 'pumpmodel' ||
                           (lowerKey.includes('model') && !lowerKey.includes('number') && !lowerKey.includes('combination'));
                  });
                  
                  // Also check for exact uppercase "MODEL"
                  if (!hasModelName) {
                    hasModelName = allKeys.some(key => key.trim().toUpperCase() === 'MODEL');
                  }
                  
                  if (hasModelName) {
                    // This is a combination-based file
                    console.log('✅ Detected combination-based database file');
                    console.log('   Total combinations:', data.length);
                    console.log('   Available columns:', allKeys);
                    console.log('   Sample row:', data[0]);
                    
                    // Find and log the actual model name column
                    const modelNameColumn = allKeys.find(key => {
                      const lowerKey = key.toLowerCase().trim();
                      return lowerKey === 'model name' || 
                             lowerKey === 'modelname' ||
                             (lowerKey === 'model' && !lowerKey.includes('number') && !lowerKey.includes('combination')) ||
                             lowerKey === 'pump model' ||
                             lowerKey === 'pumpmodel';
                    });
                    if (modelNameColumn) {
                      console.log('   ✅ Model Name column found:', modelNameColumn);
                      // Show sample model names from first few rows
                      const sampleModels = data.slice(0, 10).map(row => row[modelNameColumn]).filter(v => v);
                      console.log('   Sample model names:', sampleModels);
                    } else {
                      console.warn('   ⚠️ Model name column not clearly identified');
                    }
                    
                    // Auto-generate value mappings from Excel file
                    valueMappings = generateValueMappings(data, allKeys);
                    console.log('   📋 Auto-generated value mappings:', valueMappings);
                    
                    combinationDatabase = data;
                    pumpDatabase = []; // Clear old pump database
                    return; // Exit early, we'll use exact matching
                  } else {
                    console.log('ℹ️ Standard pump database file detected (no Model Name column)');
                  }
                }
              } catch (parseError) {
                console.error('Error parsing JSON from file:', parseError);
                throw new Error(`Error parsing database file: ${parseError.message}`);
              }
            } else {
              console.error('File has no data:', selectionFile);
            }
          } else {
            console.warn('No file assigned for selection');
          }
        } else {
          console.error('pumpDB is not available');
        }
      } catch (dbError) {
        console.error('Error loading database file for selection:', dbError);
        console.error('Error details:', {
          message: dbError.message,
          stack: dbError.stack,
          name: dbError.name
        });
      }
      
      // If no file assigned, show error message
      if (!data) {
        console.error('No database file assigned for selection. Please contact admin.');
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="background: linear-gradient(135deg, #ffebee, #ffcdd2); padding: 20px; border-radius: 12px; margin-top: 20px; border-left: 4px solid #c62828;">
              <h3 style="color: #c62828; margin-bottom: 10px;">⚠️ Database Not Configured</h3>
              <p style="color: #c62828;">No database file has been assigned for pump selection. Please contact the administrator to upload and assign a database file.</p>
              <p style="color: #c62828; font-size: 0.9em; margin-top: 10px;">Admin: Go to Admin Panel → View Database Files → Click "For Selection" on a file.</p>
            </div>
          `;
          resultBox.style.display = 'block';
        }
        // Use empty array - no pumps available
        pumpDatabase = [];
        return;
      }
      
      // Skip the header row and process actual pump data
      // Only process if not a combination-based file
      if (combinationDatabase.length === 0) {
        pumpDatabase = data.slice(1).map(pump => ({
          model: pump.Column21 || 'Unknown Model',
          productCode: pump.Column20 || 'N/A',
          series: pump.Column15 || 'Unknown Series',
          hp: parseFloat(pump.Column24?.replace('HP', '') || '0'),
          powerKw: pump.Column23 || 'N/A',
          voltage: pump.Column28 || 'N/A',
          headRange: pump.Column25 || 'N/A',
          flowRange: pump.Column27 || 'N/A',
          headMax: parseFloat(pump.Column14 || '0') * 3.28084, // Convert meters to feet
          flowMax: parseFloat(pump.Column19 || '0'), // L/h
          application: pump.Column3 || 'General',
          category: pump.Column12 || 'General',
          phase: pump.Column2 || 'Unknown',
          oilFilled: pump.Column10 || 'Unknown',
          buildingFloor: pump.Column13 || 'N/A'
        })).filter(pump => pump.model !== 'Unknown Model' && pump.hp > 0);
        
        console.log('Loaded pump data:', pumpDatabase.length, 'pumps');
      } else {
        console.log('Using combination-based matching. Loaded', combinationDatabase.length, 'combinations');
      }
    } catch (error) {
      console.error('Error loading pump data:', error);
      // Show error message
      if (resultBox) {
        resultBox.innerHTML = `
          <div style="background: linear-gradient(135deg, #ffebee, #ffcdd2); padding: 20px; border-radius: 12px; margin-top: 20px; border-left: 4px solid #c62828;">
            <h3 style="color: #c62828; margin-bottom: 10px;">⚠️ Error Loading Database</h3>
            <p style="color: #c62828;">An error occurred while loading the pump database. Please try again or contact the administrator.</p>
          </div>
        `;
        resultBox.style.display = 'block';
      }
      // Use empty array - no pumps available
      pumpDatabase = [];
    }
  }

  // 🔄 Mode Toggle Function
  window.setMode = function(mode) {
    const isSimple = mode === 'simple';
    if (simpleMode) simpleMode.style.display = isSimple ? 'block' : 'none';
    if (advancedMode) advancedMode.style.display = isSimple ? 'none' : 'block';
    if (simpleBtn) simpleBtn.classList.toggle('active-green', isSimple);
    if (advancedBtn) advancedBtn.classList.toggle('active-green', !isSimple);
    if (form) form.reset();
    if (resultBox) resultBox.style.display = 'none';
    // Re-apply filters after reset
    if (purposeSelect) purposeSelect.dispatchEvent(new Event('change'));
  };

  // Helper: get currently active source select (construction vs default)
  function getActiveSourceSelect() {
    if (constructionSourceSelect && constructionSourceSelect.style.display !== 'none') {
      return constructionSourceSelect;
    }
    return sourceSelect;
  }

  // 💧 Water Level Toggle Based on Source (adapted for select ranges)
  function toggleWaterLevel() {
    const activeSource = getActiveSourceSelect();
    if (!activeSource || !waterLevelSelect || !waterLevelLabel) return;
    const selected = (activeSource.value || '').toLowerCase();
    const depthSources = ['open well', 'borewell', 'underground tank', 'pond', 'river'];
    const showWaterLevel = depthSources.includes(selected);

    waterLevelSelect.disabled = !showWaterLevel;
    waterLevelSelect.style.display = showWaterLevel ? 'block' : 'none';
    if (waterLevelLabel) waterLevelLabel.style.display = showWaterLevel ? 'block' : 'none';
    waterLevelSelect.style.backgroundColor = showWaterLevel ? '#fff' : '#eee';
    if (!showWaterLevel) waterLevelSelect.value = '';
    console.log('Water level toggled for source:', selected, 'Show:', showWaterLevel); // Debug
  }




  //water toggle system for advance mode

function togglePumpStages() {
  const purpose = purposeSelect?.value;
  const pumpType = document.querySelector('select[name="location"]')?.value;
  const stageBox = document.getElementById('stageBox');

  const borewellOptions = ['3borwp', '4borwp', '5borwp', '6borwp', '7borwp', '8borwp'];
  const isBorewell = borewellOptions.includes(purpose);
  const isMultiStage = pumpType === 'MStage';

  if (stageBox) {
    stageBox.style.display = (isBorewell && isMultiStage) ? 'block' : 'none';
  }
}


  // 🔒 Limit source options for Agriculture: show only first 4 options + Pond
  function limitSourcesForAgriculture() {
    if (!sourceSelect) return;
    // Reset visibility first
    Array.from(sourceSelect.options).forEach(option => {
      option.hidden = false;
      option.style.display = '';
    });
    // Collect first 4 non-empty options as allowed
    const nonEmptyOptions = Array.from(sourceSelect.options).filter(o => o.value !== '');
    const firstFour = nonEmptyOptions.slice(0, 4);
    const allowedValues = new Set(firstFour.map(o => o.value.toLowerCase()));
    allowedValues.add('pond');

    Array.from(sourceSelect.options).forEach(option => {
      if (option.value === '') return; // keep placeholder visible
      const isAllowed = allowedValues.has(option.value.toLowerCase());
      option.hidden = !isAllowed;
      option.style.display = isAllowed ? '' : 'none';
    });

    // Reset to default if current selection is invalid or hidden
    const current = sourceSelect.querySelector(`option[value="${sourceSelect.value}"]`);
    if (!current || current.hidden || current.style.display === 'none') {
      // Reset to default empty option instead of auto-selecting
      sourceSelect.value = '';
    }
  }

  // 🔒 Limit source options for Construction: show only first 6 + 'roof-tank'
  function limitSourcesForConstruction() {
    if (!sourceSelect) return;
    // Reset visibility first
    Array.from(sourceSelect.options).forEach(option => {
      option.hidden = false;
      option.style.display = '';
    });

    const options = Array.from(sourceSelect.options);
    if (options.length === 0) return;

    // Determine allowed set: first 6 non-empty + 'roof-tank'
    const nonEmptyOptions = options.filter(o => o.value !== '');
    const firstSix = nonEmptyOptions.slice(0, 6);
    const allowedValues = new Set(firstSix.map(o => o.value.toLowerCase()));
    allowedValues.add('roof-tank');

    Array.from(sourceSelect.options).forEach(option => {
      if (option.value === '') return; // keep placeholder visible
      const isAllowed = allowedValues.has(option.value.toLowerCase());
      option.hidden = !isAllowed;
      option.style.display = isAllowed ? '' : 'none';
    });

    // Reset to default if current selection is invalid or hidden
    const current = sourceSelect.querySelector(`option[value="${sourceSelect.value}"]`);
    if (!current || current.hidden || current.style.display === 'none') {
      // Reset to default empty option instead of auto-selecting
      sourceSelect.value = '';
    }
  }

  // 🚫 Always hide "For hospital sewage" option from source list
  function hideHospitalSourceOption() {
    if (!sourceSelect) return;
    const hospitalOpt = sourceSelect.querySelector('option[value="hospital"]');
    if (hospitalOpt) {
      hospitalOpt.hidden = true;
      hospitalOpt.style.display = 'none';
    }
  }

  // 📦 Custom Height Toggle Based on Delivery (only for non-pressure)
  function toggleCustomHeight() {
    if (!deliverySelect || !heightDropdownBox) return;
    // Only show if not in faucet mode (pressure)
    const isFaucetMode = deliverySelect.querySelector('option[value="1"]') !== null; // Check if options are faucets
    heightDropdownBox.style.display = (!isFaucetMode && deliverySelect.value === 'custom') ? 'block' : 'none';
    if (heightDropdownBox.style.display === 'none') {
      const customHeightSelect = document.querySelector('select[name="customHeight"]');
      if (customHeightSelect) customHeightSelect.value = '';
    }
  }

  // 🚦 Purpose → Location & Source Filtering (hides last 5 sewage for agriculture)
  function filterLocationByPurpose() {
    if (!purposeSelect || !locationSelect) return;
    const selected = getCurrentPurposeValue();
    const locationLabel = locationSelect.previousElementSibling;

    const hideLocation = selected === 'construction';
    if (locationSelect && locationLabel) {
      locationSelect.style.display = hideLocation ? 'none' : 'block';
      locationLabel.style.display = hideLocation ? 'none' : 'block';
      // Reset location value when hidden
      if (hideLocation) {
        locationSelect.value = '';
      }
    }

    // Filter location options (house/mall/building hide farming etc.; agriculture hides sewage/roof/pressure)
    Array.from(locationSelect.options).forEach(option => {
      option.hidden = false;
      option.style.display = '';
      if (selected === 'house' || selected === 'mall' || selected === 'building') {
        const hideIfIndoor = ['farming', 'fountain', 'sprinkler'];
        if (hideIfIndoor.includes(option.value)) {
          option.hidden = true;
          option.style.display = 'none';
        }
      } else if (selected === 'agriculture') {
        const hideIfAgriculture = ['sewage', 'roof', 'pressure'];
        if (hideIfAgriculture.includes(option.value)) {
          option.hidden = true;
          option.style.display = 'none';
        }

        if (option.value === 'fountain') {
          option.hidden = true;
          option.style.display = 'none';
        }
      }
    });

    // Reset to default if current selection is invalid or hidden
    const currentOption = locationSelect.querySelector(`option[value="${locationSelect.value}"]`);
    if ((!currentOption || currentOption.hidden || currentOption.style.display === 'none') && !hideLocation) {
      // Reset to default empty option instead of auto-selecting
      locationSelect.value = '';
    }

    // Filter source options for purpose and toggle construction-specific source UI
    if (sourceSelect) {
      if (selected === 'agriculture') {
        // Use default source select; hide construction one
        if (constructionSourceLabel) constructionSourceLabel.style.display = 'none';
        if (constructionSourceSelect) {
          constructionSourceSelect.style.display = 'none';
          constructionSourceSelect.name = 'constructionSource';
        }
        if (sourceSelect.previousElementSibling) sourceSelect.previousElementSibling.style.display = 'block';
        sourceSelect.style.display = 'block';
        if (sourceSelect.name !== 'source') sourceSelect.name = 'source';
        limitSourcesForAgriculture();
      } else if (selected === 'construction') {
        // Hide default source and show construction-specific select with first 6 + roof-tank
        if (sourceSelect.previousElementSibling) sourceSelect.previousElementSibling.style.display = 'none';
        sourceSelect.style.display = 'none';
        if (constructionSourceLabel) constructionSourceLabel.style.display = 'block';
        if (constructionSourceSelect) {
          constructionSourceSelect.style.display = 'block';
          // build options
          const options = Array.from(sourceSelect.options).filter(o => o.value !== '');
          const firstSix = options.slice(0, 6);
          const roof = options.find(o => o.value.toLowerCase() === 'roof-tank');
          const allowed = [...firstSix];
          if (roof && !firstSix.includes(roof)) allowed.push(roof);
          constructionSourceSelect.innerHTML = '';
          // Add default option first
          const defaultOpt = document.createElement('option');
          defaultOpt.value = '';
          defaultOpt.textContent = 'Select water source (पानी का स्रोत चुनें)';
          constructionSourceSelect.appendChild(defaultOpt);
          // Add other options
          allowed.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.textContent;
            constructionSourceSelect.appendChild(o);
          });
          constructionSourceSelect.name = 'source';
          if (sourceSelect.name === 'source') sourceSelect.name = 'sourceHidden';
          // Keep default option selected (index 0)
          constructionSourceSelect.selectedIndex = 0;
        }
      } else {
        // Reset to default source select; hide construction one
        if (constructionSourceLabel) constructionSourceLabel.style.display = 'none';
        if (constructionSourceSelect) {
          constructionSourceSelect.style.display = 'none';
          constructionSourceSelect.name = 'constructionSource';
        }
        if (sourceSelect.previousElementSibling) sourceSelect.previousElementSibling.style.display = 'block';
        sourceSelect.style.display = 'block';
        if (sourceSelect.name !== 'source') sourceSelect.name = 'source';

        // Reset visibility for non-agriculture purposes
        Array.from(sourceSelect.options).forEach(option => {
          option.hidden = false;
          option.style.display = '';
        });
      }

      // Ensure hospital option stays hidden globally (on default select only)
      hideHospitalSourceOption();

      // Reset to default if current selection is invalid or hidden (for default select)
      const currentSource = sourceSelect.querySelector(`option[value="${sourceSelect.value}"]`);
      if (!currentSource || currentSource.hidden || currentSource.style.display === 'none') {
        // Reset to default empty option instead of auto-selecting
        sourceSelect.value = '';
      }

      // Update water level based on active source
      toggleWaterLevel();
    }

    // Cascade to location change
    if (locationSelect.value) locationSelect.dispatchEvent(new Event('change'));
  }

  // 🚦 Location → Source, Delivery Conversion to Faucet, Usage/Water Level Hiding
  function filterByLocation() {
    if (!locationSelect || !sourceSelect || !deliverySelect || !deliveryLabel) return;
    const selected = locationSelect.value.toLowerCase();
    const sewageSources = ['hospital', 'hotel', 'industry', 'home', 'mall'];

    // Filter source options (reset and re-apply, respecting purpose and location)
    Array.from(sourceSelect.options).forEach(option => {
      const value = option.value.toLowerCase();
      option.hidden = false;
      option.style.display = '';
      if (selected === 'sewage') {
        if (sewageSources.includes(value)) {
          option.style.display = '';
        } else {
          option.hidden = true;
          option.style.display = 'none';
        }
      } else if (selected === 'roof') {
        if (sewageSources.includes(value)) {
          option.hidden = true;
          option.style.display = 'none';
        } else {
          option.style.display = '';
        }
      } else if (selected === 'pressure') {
        if (value === 'roof-tank') {
          option.style.display = '';
        } else {
          option.hidden = true;
          option.style.display = 'none';
        }
      } else {
        // For other locations, reset initially; we'll apply purpose-specific limits below
        option.style.display = '';
      }
    });

    // For pressure mode, roof-tank will be the only visible option, but don't auto-select
    // User must explicitly select it (no defaults policy)

    // Re-apply Agriculture/Construction-specific source limit if applicable and not in restricted locations
    const currentPurpose = getCurrentPurposeValue();
    if (!['sewage', 'roof', 'pressure'].includes(selected)) {
      if (currentPurpose === 'agriculture') {
        limitSourcesForAgriculture();
      } else if (currentPurpose === 'construction') {
        limitSourcesForConstruction();
      }
    }

    // Ensure hospital option stays hidden globally
    hideHospitalSourceOption();

    // Reset to default if current selection is invalid or hidden (for default select only)
    const currentSource = sourceSelect.querySelector(`option[value="${sourceSelect.value}"]`);
    if (!currentSource || currentSource.hidden || currentSource.style.display === 'none') {
      // Reset to default empty option instead of auto-selecting
      sourceSelect.value = '';
    }

    console.log('Location changed - Source re-filtered for:', selected); // Debug

    const deliveryLabel = document.getElementById('deliveryLabel');
    const deliverySelect = document.getElementById('deliverySelect');
    const faucetsLabel = document.getElementById('faucetsLabel');
    const faucetsSelect = document.getElementById('faucetsSelect');

    // Pressure-specific changes
    if (selected === 'pressure') {
      console.log('Pressure selected - Showing faucets, hiding delivery'); // Debug
      // Hide delivery and show faucets
      deliveryLabel.style.display = 'none';
      deliverySelect.style.display = 'none';
      faucetsLabel.style.display = 'block';
      faucetsSelect.style.display = 'block';
      deliverySelect.name = 'delivery';
      deliverySelect.value = '';
      faucetsSelect.value = '';

      // Hide usage
      if (usageSelect) usageSelect.style.display = 'none';
      if (usageLabel) usageLabel.style.display = 'none';

      // Hide water level category (from roof tank, no depth needed)
      if (waterLevelSelect) waterLevelSelect.style.display = 'none';
      if (waterLevelLabel) waterLevelLabel.style.display = 'none';

      // Hide custom height
      if (heightDropdownBox) heightDropdownBox.style.display = 'none';
    } else {
      console.log('Non-pressure selected - Showing delivery, hiding faucets'); // Debug
      // Show delivery and hide faucets
      deliveryLabel.style.display = 'block';
      deliverySelect.style.display = 'block';
      faucetsLabel.style.display = 'none';
      faucetsSelect.style.display = 'none';
      deliverySelect.name = 'delivery';
      deliverySelect.value = '';
      faucetsSelect.value = '';

      // Show usage
      if (usageSelect) usageSelect.style.display = 'block';
      if (usageLabel) usageLabel.style.display = 'block';

      // Show water level category
      if (waterLevelSelect) waterLevelSelect.style.display = 'block';
      if (waterLevelLabel) waterLevelLabel.style.display = 'block';

      // Re-enable custom height toggle
      toggleCustomHeight();
    }

    toggleWaterLevel(); // Toggle based on source
  }

  // 🔍 Optimized Recommendation Engine
  async function getRecommendation(formData) {
    if (!resultBox) return null;
    
    // Load pump data if not already loaded
    if (pumpDatabase.length === 0 && combinationDatabase.length === 0) {
      await loadPumpData();
    }
    
    // Show loading animation immediately
    const isCombinationMode = combinationDatabase.length > 0;
    const databaseSize = isCombinationMode ? combinationDatabase.length : pumpDatabase.length;
    const loadingText = isCombinationMode 
      ? `Searching ${databaseSize} combinations for exact match...`
      : `Analyzing ${databaseSize || '100+'} pump models...`;
    
    resultBox.innerHTML = `
      <div style="background: linear-gradient(135deg, #e6f7ff, #b3e5fc); padding: 20px; border-radius: 12px; margin-top: 20px;">
        <div style="text-align: center;">
          <div style="font-size: 2em; margin-bottom: 15px;">🔍</div>
          <h2 style="color: #003366; margin-bottom: 10px;">${isCombinationMode ? 'Finding Exact Match...' : 'Searching for the Best Pumps...'}</h2>
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 10px;">
              <div style="width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #003366; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
              <span style="color: #003366; font-weight: bold;">${loadingText}</span>
            </div>
            <p style="color: #666; margin: 0;">${isCombinationMode ? 'Matching your selections against database combinations...' : 'Please wait while we find the perfect match for your requirements.'}</p>
          </div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    resultBox.style.display = 'block';
    
    // Calculate requirements efficiently
    const isSimple = simpleMode && simpleMode.style.display !== 'none';
    const requirements = calculateRequirements(formData, isSimple);
    const { head, flow, hp, voltage } = requirements;
    
    // Debug logging
    console.log('Requirements calculated:', requirements);
    console.log('Pump database size:', pumpDatabase.length);
    console.log('Combination database size:', combinationDatabase.length);
    
    // Add 2 second delay for loading effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we should use exact combination matching
    let matches = [];
    let exactMatch = null;
    
    if (combinationDatabase.length > 0) {
      // Use exact combination matching (100% accuracy)
      try {
        exactMatch = findExactCombinationMatch(formData);
        if (exactMatch) {
          // Convert exact match to match format for display
          matches = [{
            model: exactMatch.model,
            productCode: exactMatch.combination['Product Code'] || exactMatch.combination['ProductCode'] || 'N/A',
            series: exactMatch.combination['Series'] || exactMatch.combination['series'] || 'N/A',
            hp: exactMatch.combination['HP'] || exactMatch.combination['hp'] || 'N/A',
            powerKw: exactMatch.combination['Power'] || exactMatch.combination['power'] || 'N/A',
            voltage: exactMatch.combination['Phase'] || exactMatch.combination['phase'] || 'N/A',
            headRange: exactMatch.combination['Head Range'] || 'N/A',
            flowRange: exactMatch.combination['Flow Range'] || 'N/A',
            compatibility: 100,
            headScore: 100,
            flowScore: 100,
            hpScore: 100,
            voltageScore: 100,
            matchType: 'exact',
            accuracy: 100
          }];
          console.log('✅ Exact match found! Model:', exactMatch.model);
        } else {
          console.log('❌ No exact match found in combination database');
        }
      } catch (error) {
        console.error('Error in exact matching:', error);
        matches = [];
      }
    } else {
      // Use traditional fuzzy matching algorithm
      try {
        matches = findBestMatches(pumpDatabase, requirements);
        console.log('Matches found:', matches.length);
      } catch (error) {
        console.error('Error finding matches:', error);
        matches = [];
      }
    }

    // Display results efficiently
    let html = '';
    try {
      if (exactMatch) {
        // Generate HTML for exact match (100% accuracy)
        html = generateExactMatchHTML(exactMatch, formData);
      } else {
        html = generateResultsHTML(matches, requirements, formData);
      }
    } catch (error) {
      console.error('Error generating HTML:', error);
      html = `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h3 style="color: #856404;">⚠️ Error Generating Recommendations</h3>
          <p style="color: #856404;">An error occurred while generating recommendations. Please try again.</p>
        </div>
      `;
    }

    resultBox.innerHTML = html;
    resultBox.style.display = 'block';
    
    if (exactMatch) {
      console.log('✅ Exact match recommendation generated:', { model: exactMatch.model, accuracy: 100 });
    } else {
      console.log('Recommendation generated:', { head, flow, hp, matches: matches.length });
    }
    
    // Return recommendations data for database storage
    return {
      head: Math.round(head),
      flow: Math.round(flow / 60), // LPM
      hp: hp,
      voltage: voltage,
      matches: matches.map(m => ({
        model: m.model,
        productCode: m.productCode,
        compatibility: m.compatibility || 100,
        matchType: m.matchType || 'fuzzy',
        accuracy: m.accuracy || m.compatibility || 100
      })),
      exactMatch: exactMatch ? {
        model: exactMatch.model,
        accuracy: 100
      } : null,
      timestamp: new Date().toISOString()
    };
  }

  // 🧮 Calculate Requirements (Optimized)
  function calculateRequirements(formData, isSimple) {
    let head = 0, flow = 0, hp = 0;
    const voltage = parseInt(formData.phase || 220, 10);

    if (!isSimple) {
      // Advanced mode: Direct inputs
      head = parseFloat(formData.head || 0);
      flow = parseFloat(formData.flow || 0);
      hp = parseFloat(formData.hp || 0);
      return { head, flow: flow * 60, hp, voltage }; // Convert LPM to L/h
    }

    // Simple mode calculations - optimized with pre-calculated maps
    const WATER_LEVEL_MAP = {
      '0-5': 2.5, '5-20': 12.5, '20-28': 24, '28-50': 39, '50-100': 75,
      '100-200': 150, '200-350': 275, '350-500': 425, '500-700': 600
    };
    
    const HEIGHT_MAP = {
      ground: 0, floor1: 10, floor2: 20, floor3: 30, floor4: 40
    };
    
    const USAGE_MAP = {
      '500L-30min': 278, '1000L-30min': 556, '1500L-30min': 833,
      '2000L-60min': 333, '3000L-60min': 500,
      '1bigha-60min': 1000, '3bigha-60min': 3000, '6bigha-60min': 6000
    };
    
    const FAUCET_MAP = { 1: 20, 2: 40, 4: 80, 6: 120, 8: 160 };

    // Calculate depth
    head += WATER_LEVEL_MAP[formData.waterLevel] || 0;

    // Check if in faucet mode (pressure)
    const isFaucetMode = formData.faucets || (formData.delivery && ['1','2','4','6','8'].includes(formData.delivery));
    if (isFaucetMode) {
      head += 15; // Default pressure head
      flow = FAUCET_MAP[formData.faucets || formData.delivery] || 40;
    } else {
      // Normal delivery head
      head += HEIGHT_MAP[formData.delivery] || parseInt(formData.customHeight || 50, 10);
      flow = USAGE_MAP[formData.usage] || 500;
    }
    
    // Convert flow from LPM to L/h for comparison
    flow = flow * 60;
    
    // Optimized HP calculation
    const flowGpm = (flow / 3.785) / 60; // L/h to GPM
    hp = Math.max(0.5, Math.ceil((head * flowGpm) / 3960 * 1.5));

    return { head, flow, hp, voltage };
  }

  // 🔄 Auto-generate value mappings from Excel file
  function generateValueMappings(excelData, columnKeys) {
    const mappings = {
      source: {},
      delivery: {},
      purpose: {},
      location: {},
      usage: {},
      phase: {},
      quality: {}
    };
    
    // Helper to get column value
    const getColumnValue = (row, possibleKeys) => {
      for (const key of possibleKeys) {
        if (row.hasOwnProperty(key)) {
          const value = row[key];
          if (value !== null && value !== undefined && value !== '') {
            return String(value).trim();
          }
        }
      }
      // Try trimmed keys
      const allKeys = Object.keys(row);
      for (const key of allKeys) {
        const trimmedKey = key.trim();
        if (possibleKeys.some(pk => pk.trim().toLowerCase() === trimmedKey.toLowerCase())) {
          const value = row[key];
          if (value !== null && value !== undefined && value !== '') {
            return String(value).trim();
          }
        }
      }
      return null;
    };
    
    // Extract all unique values from Excel for each field
    const sourceValues = new Set();
    const deliveryValues = new Set();
    const purposeValues = new Set();
    const locationValues = new Set();
    const usageValues = new Set();
    const phaseValues = new Set();
    const qualityValues = new Set();
    
    excelData.forEach(row => {
      const source = getColumnValue(row, ['Source', 'source', 'SOURCE']);
      const delivery = getColumnValue(row, ['Delivery', 'delivery', 'DELIVERY']);
      const purpose = getColumnValue(row, ['Purpose', 'purpose', 'PURPOSE']);
      const location = getColumnValue(row, ['Location', 'location', 'LOCATION']);
      const usage = getColumnValue(row, ['Usage', 'usage', 'USAGE']);
      const phase = getColumnValue(row, ['Phase', 'phase', 'PHASE']);
      const quality = getColumnValue(row, ['Quality', 'quality', 'QUALITY']);
      
      if (source) sourceValues.add(source.toLowerCase().trim());
      if (delivery) deliveryValues.add(delivery.toLowerCase().trim());
      if (purpose) purposeValues.add(purpose.toLowerCase().trim());
      if (location) locationValues.add(location.toLowerCase().trim());
      if (usage) usageValues.add(usage.toLowerCase().trim());
      if (phase) phaseValues.add(phase.toLowerCase().trim());
      if (quality) qualityValues.add(quality.toLowerCase().trim());
    });
    
    // Generate mappings for Source field
    // Form values: industry, hotel, hospital, home, mall
    // Excel values: industry sewage, hotels sewage, mall/shopping complex sewage, etc.
    const sourceFormValues = ['industry', 'hotel', 'hospital', 'home', 'mall'];
    
    Array.from(sourceValues).forEach(excelValue => {
      const excelLower = excelValue.toLowerCase();
      
      // For each form value, check if Excel value contains it
      sourceFormValues.forEach(formValue => {
        if (excelLower.includes(formValue) && excelLower.includes('sewage')) {
          // Prefer longer/more specific matches
          if (!mappings.source[formValue] || 
              mappings.source[formValue].length < excelValue.length ||
              excelValue.includes('/') || excelValue.includes('shopping')) {
            mappings.source[formValue] = excelValue;
          }
        }
      });
    });
    
    // Explicitly handle known variations
    if (sourceValues.has('hotels sewage') || Array.from(sourceValues).some(v => v.includes('hotels sewage'))) {
      mappings.source['hotel'] = Array.from(sourceValues).find(v => v.includes('hotels sewage')) || 'hotels sewage';
    }
    if (sourceValues.has('mall/shopping complex sewage') || Array.from(sourceValues).some(v => v.includes('mall/shopping'))) {
      mappings.source['mall'] = Array.from(sourceValues).find(v => v.includes('mall/shopping')) || 'mall/shopping complex sewage';
    }
    if (sourceValues.has('industry sewage') || Array.from(sourceValues).some(v => v.includes('industry sewage'))) {
      mappings.source['industry'] = Array.from(sourceValues).find(v => v.includes('industry sewage')) || 'industry sewage';
    }
    
    // Generate mappings for Delivery field
    Array.from(deliveryValues).forEach(excelValue => {
      const excelLower = excelValue.toLowerCase();
      // Map floor values
      if (excelLower.includes('1st') || excelLower.includes('first')) {
        mappings.delivery['floor1'] = excelValue;
      }
      if (excelLower.includes('2nd') || excelLower.includes('second')) {
        mappings.delivery['floor2'] = excelValue;
      }
      if (excelLower.includes('3rd') || excelLower.includes('third')) {
        mappings.delivery['floor3'] = excelValue;
      }
      if (excelLower.includes('4th') || excelLower.includes('fourth')) {
        mappings.delivery['floor4'] = excelValue;
      }
      if (excelLower.includes('ground')) {
        mappings.delivery['ground'] = excelValue;
      }
    });
    
    console.log('   📊 Unique values found in Excel:');
    console.log('     Source:', Array.from(sourceValues));
    console.log('     Delivery:', Array.from(deliveryValues));
    console.log('     Purpose:', Array.from(purposeValues));
    console.log('     Location:', Array.from(locationValues));
    console.log('     Usage:', Array.from(usageValues));
    console.log('     Phase:', Array.from(phaseValues));
    console.log('     Quality:', Array.from(qualityValues));
    
    return mappings;
  }

  // 🎯 Exact Combination Matching (100% Accuracy)
  function findExactCombinationMatch(formData) {
    if (!combinationDatabase || combinationDatabase.length === 0) {
      console.warn('Combination database is empty');
      return null;
    }
    
    // Normalize form data for matching
    const normalizeValue = (value) => {
      if (!value) return '';
      return String(value).toLowerCase().trim();
    };
    
    // Map delivery values from form to Excel format (using auto-generated mappings)
    const mapDeliveryValue = (formValue) => {
      if (!formValue) return '';
      const normalized = normalizeValue(formValue);
      
      // Use auto-generated mappings if available
      if (valueMappings.delivery && valueMappings.delivery[normalized]) {
        return normalizeValue(valueMappings.delivery[normalized]);
      }
      
      // Fallback to hardcoded mappings
      const deliveryMap = {
        'floor1': '1st floor',
        'floor2': '2nd floor',
        'floor3': '3rd floor',
        'floor4': '4th floor',
        'ground': 'ground',
        'ground level': 'ground'
      };
      
      // Check if it's already in Excel format
      if (normalized.includes('1st') || normalized.includes('first')) return normalizeValue('1st floor');
      if (normalized.includes('2nd') || normalized.includes('second')) return normalizeValue('2nd floor');
      if (normalized.includes('3rd') || normalized.includes('third')) return normalizeValue('3rd floor');
      if (normalized.includes('4th') || normalized.includes('fourth')) return normalizeValue('4th floor');
      
      // Return mapped value or original (normalized)
      return normalizeValue(deliveryMap[normalized] || normalized);
    };
    
    // Map source values from form to Excel format (using auto-generated mappings)
    const mapSourceValue = (formValue) => {
      if (!formValue) return '';
      const normalized = normalizeValue(formValue);
      
      // Use auto-generated mappings if available
      if (valueMappings.source && valueMappings.source[normalized]) {
        return normalizeValue(valueMappings.source[normalized]);
      }
      
      // Fallback to hardcoded mappings
      const sourceMap = {
        'industry': 'industry sewage',
        'hospital': 'hospital sewage',
        'hotel': 'hotels sewage',  // Note: Excel has "hotels sewage" (plural)
        'home': 'home sewage',
        'mall': 'mall/shopping complex sewage'  // Excel has "mall/shopping complex sewage"
      };
      
      // If already in Excel format (contains "sewage"), return as is
      if (normalized.includes('sewage')) {
        return normalized;
      }
      
      // Return mapped value or original (normalized)
      return normalizeValue(sourceMap[normalized] || normalized);
    };
    
    const userSelection = {
      purpose: normalizeValue(formData.purpose),
      location: normalizeValue(formData.location),
      source: mapSourceValue(formData.source), // Map source value
      waterLevel: normalizeValue(formData.waterLevel),
      delivery: mapDeliveryValue(formData.delivery), // Map delivery value
      customHeight: normalizeValue(formData.customHeight),
      usage: normalizeValue(formData.usage),
      phase: normalizeValue(formData.phase),
      quality: normalizeValue(formData.quality)
    };
    
        console.log('🔍 Starting exact combination matching...');
        console.log('   Raw Form Data:', formData);
        console.log('   Normalized User Selection:', userSelection);
        console.log('   Total combinations in database:', combinationDatabase.length);
        if (combinationDatabase.length > 0) {
          console.log('   Sample combination keys:', Object.keys(combinationDatabase[0]));
          console.log('   Sample combination:', combinationDatabase[0]);
          // Check if sample has " MODEL " column
          const sampleKeys = Object.keys(combinationDatabase[0]);
          const modelKey = sampleKeys.find(k => k.trim().toLowerCase() === 'model');
          if (modelKey) {
            console.log(`   ✅ Found MODEL column: "${modelKey}" (with spaces: ${modelKey !== modelKey.trim()})`);
            console.log(`   Sample model value: "${combinationDatabase[0][modelKey]}"`);
          }
        }
        
        // Find exact match
        let matchCount = 0;
        let debugMatchAttempts = []; // Store first 5 non-matching attempts for debugging
        const MAX_DEBUG_ATTEMPTS = 5;
        
        for (const combination of combinationDatabase) {
          matchCount++;
          if (matchCount % 10000 === 0) {
            console.log(`   Checked ${matchCount} combinations...`);
          }
      
      // Normalize combination values - try multiple column name variations
      // Also check keys with spaces (like " MODEL ")
      const getComboValue = (possibleKeys) => {
        // First try exact keys
        for (const key of possibleKeys) {
          if (combination.hasOwnProperty(key)) {
            const value = combination[key];
            if (value !== null && value !== undefined && value !== '') {
              return normalizeValue(value);
            }
          }
        }
        // Then try keys with spaces (trimmed comparison)
        const allKeys = Object.keys(combination);
        for (const key of allKeys) {
          const trimmedKey = key.trim();
          if (possibleKeys.some(pk => pk.trim().toLowerCase() === trimmedKey.toLowerCase())) {
            const value = combination[key];
            if (value !== null && value !== undefined && value !== '') {
              return normalizeValue(value);
            }
          }
        }
        return '';
      };
      
      const comboPurpose = getComboValue(['Purpose', 'purpose', 'PURPOSE']);
      const comboLocation = getComboValue(['Location', 'location', 'LOCATION']);
      const comboSource = getComboValue(['Source', 'source', 'SOURCE']);
      const comboWaterLevel = getComboValue(['Water Level', 'WaterLevel', 'waterLevel', 'water level', 'WATER LEVEL']);
      // Get delivery from Excel (already normalized by getComboValue)
      const comboDelivery = getComboValue(['Delivery', 'delivery', 'DELIVERY']);
      const comboCustomHeight = getComboValue(['Custom Height', 'CustomHeight', 'customHeight', 'custom height', 'CUSTOM HEIGHT']);
      const comboUsage = getComboValue(['Usage', 'usage', 'USAGE']);
      const comboPhase = getComboValue(['Phase', 'phase', 'PHASE']);
      const comboQuality = getComboValue(['Quality', 'quality', 'QUALITY']);
      
      // Build comparison object for debugging
      const comboValues = {
        purpose: comboPurpose,
        location: comboLocation,
        source: comboSource,
        waterLevel: comboWaterLevel,
        delivery: comboDelivery,
        customHeight: comboCustomHeight,
        usage: comboUsage,
        phase: comboPhase,
        quality: comboQuality
      };
      
      // Exact field-by-field matching with detailed comparison
      // Special handling for delivery to match "1st floor" with "floor1"
      const compareDelivery = (excelValue, formValue) => {
        if (!excelValue && !formValue) return true; // Both empty
        if (!excelValue || !formValue) return false; // One empty, one not
        const excelNorm = normalizeValue(excelValue);
        const formNorm = normalizeValue(formValue);
        // Direct match
        if (excelNorm === formNorm) return true;
        // Handle "1st floor" vs "floor1" variations
        if ((excelNorm.includes('1st') || excelNorm.includes('first')) && 
            (formNorm.includes('floor1') || formNorm === '1st floor' || formNorm.includes('1st'))) return true;
        if ((excelNorm.includes('2nd') || excelNorm.includes('second')) && 
            (formNorm.includes('floor2') || formNorm === '2nd floor' || formNorm.includes('2nd'))) return true;
        if ((excelNorm.includes('3rd') || excelNorm.includes('third')) && 
            (formNorm.includes('floor3') || formNorm === '3rd floor' || formNorm.includes('3rd'))) return true;
        if ((excelNorm.includes('4th') || excelNorm.includes('fourth')) && 
            (formNorm.includes('floor4') || formNorm === '4th floor' || formNorm.includes('4th'))) return true;
        return false;
      };
      
      const fieldComparisons = {
        purpose: comboPurpose === userSelection.purpose,
        location: comboLocation === userSelection.location,
        source: comboSource === userSelection.source,
        waterLevel: comboWaterLevel === userSelection.waterLevel,
        delivery: compareDelivery(comboDelivery, userSelection.delivery),
        customHeight: comboCustomHeight === userSelection.customHeight,
        usage: comboUsage === userSelection.usage,
        phase: comboPhase === userSelection.phase,
        quality: comboQuality === userSelection.quality
      };
      
      // Enhanced logging for first match attempt and for model "a"
      const comboModelName = (() => {
        const allKeys = Object.keys(combination);
        for (const key of allKeys) {
          const trimmedKey = key.trim().toLowerCase();
          if (trimmedKey === 'model' || trimmedKey === 'model name') {
            return String(combination[key]).trim();
          }
        }
        return null;
      })();
      
      if (matchCount === 1 || (comboModelName && comboModelName.toLowerCase() === 'a')) {
        console.log(`\n📊 Combination ${matchCount} Comparison (Model: ${comboModelName || 'N/A'}):`);
        console.log('   Raw Excel Row:', combination);
        console.log('   Excel Values (normalized):', comboValues);
        console.log('   User Values (normalized):', userSelection);
        console.log('   Field Matches:', fieldComparisons);
        console.log('   Source Details:', {
          excelRaw: combination.Source || combination.source || combination['Source'] || 'NOT FOUND',
          excelNormalized: comboSource,
          userRaw: formData.source,
          userMapped: userSelection.source,
          match: fieldComparisons.source
        });
        console.log('   Delivery Details:', {
          excelRaw: combination.Delivery || combination.delivery || combination['Delivery'] || 'NOT FOUND',
          excelNormalized: comboDelivery,
          userRaw: formData.delivery,
          userMapped: userSelection.delivery,
          match: fieldComparisons.delivery
        });
        console.log('   All Field Details:');
        Object.keys(fieldComparisons).forEach(field => {
          const excelVal = comboValues[field];
          const userVal = userSelection[field];
          const match = fieldComparisons[field];
          console.log(`     ${match ? '✅' : '❌'} ${field}: Excel="${excelVal}" vs User="${userVal}"`);
        });
      }
      
      const isMatch = Object.values(fieldComparisons).every(match => match === true);
      
      // Store debug info for first few non-matches
      if (!isMatch && debugMatchAttempts.length < MAX_DEBUG_ATTEMPTS) {
        const mismatches = Object.entries(fieldComparisons)
          .filter(([_, match]) => !match)
          .map(([field, _]) => field);
        
        // Get model name for this combination
        let comboModelName = 'N/A';
        const allKeys = Object.keys(combination);
        for (const key of allKeys) {
          const trimmedKey = key.trim().toLowerCase();
          if (trimmedKey === 'model' || trimmedKey === 'model name') {
            comboModelName = String(combination[key]).trim();
            break;
          }
        }
        
        debugMatchAttempts.push({
          comboValues,
          userSelection,
          mismatches,
          fieldComparisons, // Include full comparison details
          modelName: comboModelName,
          rawCombination: combination // Include raw data for debugging
        });
      }
      
      if (isMatch) {
        // Get model name from various possible column names (case-insensitive search)
        let modelName = null;
        
        // Try all possible column name variations (case-insensitive)
        const possibleKeys = Object.keys(combination);
        console.log('   Available columns in combination:', possibleKeys);
        
        // First, try exact key match (case-sensitive) for common variations
        // Also check keys with spaces like " MODEL "
        const exactKeys = ['MODEL', 'Model Name', 'Model', 'model', 'ModelName', ' MODEL ', ' MODEL', 'MODEL '];
        for (const exactKey of exactKeys) {
          if (combination.hasOwnProperty(exactKey)) {
            const value = combination[exactKey];
            const stringValue = value !== null && value !== undefined ? String(value).trim() : '';
            if (stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined') {
              modelName = stringValue;
              console.log(`   ✅ Found model name in exact key "${exactKey}": "${modelName}"`);
              break;
            }
          }
        }
        
        // Also check all keys for trimmed matches (handles " MODEL " with spaces)
        if (!modelName || modelName === '') {
          for (const key of possibleKeys) {
            const trimmedKey = key.trim().toLowerCase();
            if (trimmedKey === 'model' || trimmedKey === 'model name' || trimmedKey === 'modelname') {
              const value = combination[key];
              const stringValue = value !== null && value !== undefined ? String(value).trim() : '';
              if (stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined') {
                modelName = stringValue;
                console.log(`   ✅ Found model name in column "${key}" (with spaces): "${modelName}"`);
                break;
              }
            }
          }
        }
        
        // If not found, try case-insensitive search
        if (!modelName || modelName === '') {
          for (const key of possibleKeys) {
            const lowerKey = key.toLowerCase().trim();
            // Check for model column (case-insensitive)
            if (lowerKey === 'model name' || 
                lowerKey === 'modelname' ||
                lowerKey === 'model' ||
                lowerKey === 'pump model' ||
                lowerKey === 'pumpmodel' ||
                lowerKey === 'pump_name' ||
                lowerKey === 'pump_model' ||
                (lowerKey.includes('model') && !lowerKey.includes('number') && !lowerKey.includes('combination'))) {
              const value = combination[key];
              // Handle all types of values including single characters, numbers, etc.
              const stringValue = value !== null && value !== undefined ? String(value).trim() : '';
              if (stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined') {
                modelName = stringValue;
                console.log(`   ✅ Found model name in column "${key}": "${modelName}" (type: ${typeof value})`);
                break;
              } else {
                console.log(`   ⚠️ Column "${key}" exists but value is empty:`, value, `(type: ${typeof value})`);
              }
            }
          }
        }
        
        // Fallback to direct property access (try common variations)
        if (!modelName || modelName === '') {
          const fallbackKeys = [
            'Model Name', 'Model', 'model', 'MODEL',
            'ModelName', 'modelName', 'MODELNAME',
            'Pump Model', 'PumpModel', 'PUMP MODEL',
            'Pump_Name', 'pump_model', 'PUMP_MODEL'
          ];
          
          for (const key of fallbackKeys) {
            if (combination.hasOwnProperty(key)) {
              const value = combination[key];
              const stringValue = value !== null && value !== undefined ? String(value).trim() : '';
              if (stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined') {
                modelName = stringValue;
                console.log(`   ✅ Found model name in fallback column "${key}": "${modelName}" (type: ${typeof value})`);
                break;
              } else {
                console.log(`   ⚠️ Fallback column "${key}" exists but value is empty:`, value);
              }
            }
          }
        }
        
        // Final fallback - try to find ANY column that might contain model name
        if (!modelName || String(modelName).trim() === '') {
          // Last resort: check all columns for any value that looks like a model name
          for (const key of possibleKeys) {
            const value = combination[key];
            if (value !== null && value !== undefined) {
              const stringValue = String(value).trim();
              // Accept any non-empty value as potential model name if we haven't found one
              if (stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined') {
                // Skip known non-model columns
                const lowerKey = key.toLowerCase();
                if (!lowerKey.includes('purpose') && 
                    !lowerKey.includes('location') && 
                    !lowerKey.includes('source') &&
                    !lowerKey.includes('water') &&
                    !lowerKey.includes('delivery') &&
                    !lowerKey.includes('usage') &&
                    !lowerKey.includes('phase') &&
                    !lowerKey.includes('quality') &&
                    !lowerKey.includes('combination') &&
                    !lowerKey.includes('number') &&
                    !lowerKey.includes('#')) {
                  modelName = stringValue;
                  console.log(`   ⚠️ Using fallback model name from column "${key}": "${modelName}"`);
                  break;
                }
              }
            }
          }
        }
        
        // Final check - even single characters like "a" should be valid
        if (!modelName || String(modelName).trim() === '') {
          console.warn('⚠️ Model name not found in combination:', combination);
          modelName = 'Model Name Not Found in Database';
        } else {
          modelName = String(modelName).trim();
          // Log the model name found (even if it's just "a")
          console.log(`   📦 Model name extracted: "${modelName}" (length: ${modelName.length})`);
        }
        
        // Extract HP value (handles column names with spaces like " HP ")
        const extractHP = (combo) => {
          const hpKeys = ['HP', 'hp', 'Horsepower', 'horsepower', 'HORSEPOWER', ' HP ', ' HP', 'HP '];
          const allKeys = Object.keys(combo);
          
          // Try exact keys first
          for (const key of hpKeys) {
            if (combo.hasOwnProperty(key)) {
              const value = combo[key];
              if (value !== null && value !== undefined && value !== '') {
                const stringValue = String(value).trim();
                if (stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined') {
                  return stringValue;
                }
              }
            }
          }
          
          // Try trimmed keys (handles " HP " with spaces)
          for (const key of allKeys) {
            const trimmedKey = key.trim().toLowerCase();
            if (trimmedKey === 'hp' || trimmedKey === 'horsepower') {
              const value = combo[key];
              if (value !== null && value !== undefined && value !== '') {
                const stringValue = String(value).trim();
                if (stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined') {
                  return stringValue;
                }
              }
            }
          }
          
          return null;
        };
        
        // Extract SKU value (handles column names with spaces like " SKU ")
        const extractSKU = (combo) => {
          const skuKeys = ['SKU', 'sku', 'Sku', ' SKU ', ' SKU', 'SKU '];
          const allKeys = Object.keys(combo);
          
          // Try exact keys first
          for (const key of skuKeys) {
            if (combo.hasOwnProperty(key)) {
              const value = combo[key];
              if (value !== null && value !== undefined && value !== '') {
                const stringValue = String(value).trim();
                if (stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined') {
                  return stringValue;
                }
              }
            }
          }
          
          // Try trimmed keys (handles " SKU " with spaces)
          for (const key of allKeys) {
            const trimmedKey = key.trim().toLowerCase();
            if (trimmedKey === 'sku') {
              const value = combo[key];
              if (value !== null && value !== undefined && value !== '') {
                const stringValue = String(value).trim();
                if (stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined') {
                  return stringValue;
                }
              }
            }
          }
          
          return null;
        };
        
        const hp = extractHP(combination);
        const sku = extractSKU(combination);
        
        if (hp) console.log(`   ⚡ HP extracted: "${hp}"`);
        if (sku) console.log(`   🏷️ SKU extracted: "${sku}"`);
        
        console.log('✅✅✅ EXACT MATCH FOUND! ✅✅✅');
        console.log('   Model Name from Database:', modelName);
        if (hp) console.log('   HP from Database:', hp);
        if (sku) console.log('   SKU from Database:', sku);
        console.log('   Matched Combination:', userSelection);
        console.log('   Full Combination Data:', combination);
        console.log('   Combinations checked:', matchCount);
        
        return {
          model: modelName,
          hp: hp,
          sku: sku,
          combination: combination,
          matchType: 'exact',
          accuracy: 100
        };
      }
    }
    
    console.log('❌ No exact match found after checking', matchCount, 'combinations');
    console.log('   User Selection:', userSelection);
    console.log('   This combination does not exist in the database');
    
    // Show debug info for first few non-matches
    if (debugMatchAttempts.length > 0) {
      console.log('\n🔍 Debug: Why matches failed (showing first', debugMatchAttempts.length, 'attempts):');
      debugMatchAttempts.forEach((attempt, idx) => {
        console.log(`\n   Attempt ${idx + 1}:`);
        console.log('     Model in DB:', attempt.modelName);
        console.log('     Mismatched fields:', attempt.mismatches.join(', '));
        attempt.mismatches.forEach(field => {
          console.log(`       ${field}: User="${attempt.userSelection[field]}" vs DB="${attempt.comboValues[field]}"`);
        });
      });
    }
    
    // Also search for combinations with model "a" to help debug
    console.log('\n🔍 Searching for combinations with model name "a"...');
    let modelACount = 0;
    const modelACombinations = [];
    for (const combo of combinationDatabase) {
      const possibleKeys = Object.keys(combo);
      for (const key of possibleKeys) {
        // Check trimmed key (handles " MODEL " with spaces)
        const trimmedKey = key.trim().toLowerCase();
        if ((trimmedKey.includes('model') || trimmedKey === 'model') && 
            String(combo[key]).trim().toLowerCase() === 'a') {
          modelACount++;
          if (modelACombinations.length < 3) {
            modelACombinations.push({
              modelName: String(combo[key]).trim(),
              modelColumn: key, // Show the actual column name
              allFields: combo,
              keys: possibleKeys
            });
          }
        }
      }
    }
    console.log(`   Found ${modelACount} combinations with model name "a"`);
    if (modelACombinations.length > 0) {
      console.log('   Sample combination(s) with model "a":', modelACombinations[0]);
      console.log('   Model column name:', modelACombinations[0].modelColumn);
      console.log('   Model value:', modelACombinations[0].modelName);
      console.log('   To get model "a", you need to match these exact values:');
      const sample = modelACombinations[0].allFields;
      
      // Use the same getComboValue logic to extract values
      const getSampleValue = (possibleKeys) => {
        for (const key of possibleKeys) {
          if (sample.hasOwnProperty(key)) {
            const value = sample[key];
            if (value !== null && value !== undefined && value !== '') {
              return value; // Return raw value first
            }
          }
        }
        // Try trimmed keys
        const allKeys = Object.keys(sample);
        for (const key of allKeys) {
          const trimmedKey = key.trim();
          if (possibleKeys.some(pk => pk.trim().toLowerCase() === trimmedKey.toLowerCase())) {
            const value = sample[key];
            if (value !== null && value !== undefined && value !== '') {
              return value;
            }
          }
        }
        return '';
      };
      
      const requiredFields = {
        purpose: getSampleValue(['Purpose', 'purpose', 'PURPOSE']),
        location: getSampleValue(['Location', 'location', 'LOCATION']),
        source: getSampleValue(['Source', 'source', 'SOURCE']),
        waterLevel: getSampleValue(['Water Level', 'WaterLevel', 'waterLevel', 'water level', 'WATER LEVEL']),
        delivery: getSampleValue(['Delivery', 'delivery', 'DELIVERY']),
        customHeight: getSampleValue(['Custom Height', 'CustomHeight', 'customHeight', 'custom height', 'CUSTOM HEIGHT']),
        usage: getSampleValue(['Usage', 'usage', 'USAGE']),
        phase: getSampleValue(['Phase', 'phase', 'PHASE']),
        quality: getSampleValue(['Quality', 'quality', 'QUALITY'])
      };
      // Normalize the required fields for comparison (using same mapping functions)
      const normalizedRequiredFields = {
        purpose: normalizeValue(requiredFields.purpose),
        location: normalizeValue(requiredFields.location),
        source: mapSourceValue(requiredFields.source), // Map source value
        waterLevel: normalizeValue(requiredFields.waterLevel),
        delivery: mapDeliveryValue(requiredFields.delivery), // Map delivery value
        customHeight: normalizeValue(requiredFields.customHeight),
        usage: normalizeValue(requiredFields.usage),
        phase: normalizeValue(requiredFields.phase),
        quality: normalizeValue(requiredFields.quality)
      };
      
      console.log('   Required selections (raw):', requiredFields);
      console.log('   Required selections (normalized):', normalizedRequiredFields);
      console.log('   Your selections (normalized):', userSelection);
      
      // Compare field by field
      console.log('   Field-by-field comparison:');
      Object.keys(normalizedRequiredFields).forEach(field => {
        const required = normalizedRequiredFields[field];
        const user = userSelection[field];
        const match = required === user;
        const status = match ? '✅' : '❌';
        console.log(`     ${status} ${field}: Required="${required}" vs Your="${user}"`);
      });
    }
    
    return null;
  }

  // 🎯 Find Best Matches (Optimized Algorithm)
  function findBestMatches(database, requirements) {
    // Safety check
    if (!database || database.length === 0) {
      console.warn('Pump database is empty or not loaded');
      return [];
    }
    
    const { head, flow, hp, voltage } = requirements;
    const voltageStr = voltage.toString();
    
    // Pre-filter pumps for better performance (early exit conditions)
    // Only consider pumps that meet minimum criteria
    const MIN_COMPATIBILITY = 20;
    const candidates = [];
    const perfectMatches = [];
    
    // Single pass with early optimizations
    for (const pump of database) {
      // Safety check for pump data
      if (!pump || !pump.voltage) {
        continue;
      }
      
      // Quick voltage check (most restrictive)
      const pumpVoltageStr = pump.voltage.toString();
      if (!pumpVoltageStr.includes(voltageStr)) {
        continue; // Skip if voltage doesn't match
      }
      
      // Calculate scores efficiently
      const headScore = pump.headMax >= head ? 100 : Math.max(0, (pump.headMax / head) * 100);
      const flowScore = pump.flowMax >= flow ? 100 : Math.max(0, (pump.flowMax / flow) * 100);
      const hpScore = pump.hp >= hp ? 100 : Math.max(0, (pump.hp / hp) * 100);
      const voltageScore = 100; // Already filtered
      
      // Weighted compatibility
      const compatibility = Math.round(
        headScore * 0.3 + flowScore * 0.3 + hpScore * 0.2 + voltageScore * 0.2
      );
      
      // Early exit for perfect matches
      if (compatibility >= 95) {
        perfectMatches.push({
          ...pump,
          compatibility,
          headScore: Math.round(headScore),
          flowScore: Math.round(flowScore),
          hpScore: Math.round(hpScore),
          voltageScore
        });
        if (perfectMatches.length >= 8) break; // Found enough perfect matches
        continue;
      }
      
      // Only add if meets minimum threshold
      if (compatibility >= MIN_COMPATIBILITY) {
        candidates.push({
          ...pump,
          compatibility,
          headScore: Math.round(headScore),
          flowScore: Math.round(flowScore),
          hpScore: Math.round(hpScore),
          voltageScore
        });
      }
    }
    
    // Combine perfect matches with candidates
    const allMatches = [...perfectMatches, ...candidates];
    
    // Efficient partial sort (only top 8 needed)
    if (allMatches.length <= 8) {
      return allMatches.sort((a, b) => b.compatibility - a.compatibility);
    }
    
    // Partial sort for top 8 (more efficient than full sort)
    return allMatches
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 8);
  }

  // 📄 Generate Results HTML (Optimized)
  // 🏷️ Format Selection Value for Display
  function formatSelectionValue(key, value) {
    if (!value || value === 'N/A' || value === '') return 'Not Selected';
    
    const formatted = {
      purpose: {
        'house': 'For Home Use',
        'agriculture': 'For Agriculture',
        'construction': 'For Construction',
        'mall': 'Inside Shopping Mall',
        'building': 'Inside Multi-Story Building'
      },
      location: {
        'sewage': 'For Sewage Transfer',
        'roof': 'Water Transfer to Roof Tank',
        'pressure': 'For Water Pressure (Bathroom/Kitchen/Fountain)',
        'sprinkler': 'For Sprinkler',
        'farming': 'For Farming'
      },
      source: {
        'open well': 'Open Well',
        'borewell': 'Borewell',
        'river': 'River/Bomba',
        'underground tank': 'Underground Tank',
        'municipal': 'Municipal Pipeline',
        'pond': 'Pond',
        'hospital': 'For Hospital Sewage',
        'hotel': 'For Hotels Sewage',
        'industry': 'For Industry Sewage',
        'home': 'For Home Sewage',
        'mall': 'For Mall/Shopping Complex Sewage',
        'roof-tank': 'From Roof Tank'
      },
      waterLevel: {
        '0-5': '0-5 feet from ground',
        '5-20': '5-20 feet from ground',
        '20-28': '20-28 feet from ground',
        '28-50': '28-50 feet from ground',
        '50-100': '50-100 feet from ground',
        '100-200': '100-200 feet from ground',
        '200-350': '200-350 feet from ground',
        '350-500': '350-500 feet from ground',
        '500-700': '500-700 feet from ground'
      },
      delivery: {
        'ground': 'Ground Level',
        'floor1': '1st Floor (~10 ft)',
        'floor2': '2nd Floor (~20 ft)',
        'floor3': '3rd Floor (~30 ft)',
        'floor4': '4th Floor (~40 ft)',
        'custom': 'Above 4th Floor'
      },
      customHeight: {
        '100': '100 ft from ground',
        '150': '150 ft from ground',
        '200': '200 ft from ground',
        '300': '300 ft from ground',
        '450': '450 ft from ground',
        '600': '600 ft from ground',
        '800': '800 ft from ground',
        '1000': '1000 ft from ground'
      },
      usage: {
        '500L-30min': '500L tank in half-an-hour',
        '1000L-30min': '1000L tank in half-an-hour',
        '1500L-30min': '1500L tank in half-an-hour',
        '2000L-60min': '2000L tank in one hour',
        '3000L-60min': '3000L tank in one hour',
        '1bigha-60min': 'One bigha farm in one hour',
        '3bigha-60min': 'Three bigha farm in one hour',
        '6bigha-60min': 'Six bigha farm in one hour'
      },
      phase: {
        '140': '140V - Single Phase (Low Voltage)',
        '220': '220V - Single Phase',
        '380': '380V - Two Phase',
        '415': '415V - Three Phase'
      },
      quality: {
        'premium': 'Premium',
        'standard': 'Standard',
        'economical': 'Economical'
      }
    };
    
    const valueLower = String(value).toLowerCase().trim();
    if (formatted[key] && formatted[key][valueLower]) {
      return formatted[key][valueLower];
    }
    
    // If no mapping found, format the value nicely
    if (key === 'customHeight' && !isNaN(value)) {
      return `${value} ft from ground`;
    }
    
    // Default: capitalize first letter of each word
    return String(value).split(/[\s-]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  // 📊 Generate Exact Match HTML (100% Accuracy)
  function generateExactMatchHTML(exactMatch, formData) {
    const model = exactMatch.model;
    const hp = exactMatch.hp || null;
    const sku = exactMatch.sku || null;
    const combination = exactMatch.combination;
    
    // Extract additional information from combination if available
    const productCode = combination['Product Code'] || combination['ProductCode'] || combination['Product_Code'] || null;
    const series = combination['Series'] || combination['series'] || null;
    const power = combination['Power'] || combination['power'] || combination['Power (KW)'] || null;
    
    // Extract image from "Product Image" column, column S, or other image columns
    let pumpImage = null;
    let imageColumnName = null;
    const allKeys = Object.keys(combination);
    
    console.log('   🔍 Searching for product image column...');
    console.log('   Available columns:', allKeys);
    
    // Debug: Log all columns that might be related to images
    const imageRelatedKeys = allKeys.filter(key => {
      const lowerKey = key.toLowerCase().trim();
      return lowerKey.includes('image') || lowerKey.includes('picture') || lowerKey === 's' || lowerKey === 'column s';
    });
    console.log('   📸 Columns that might contain images:', imageRelatedKeys);
    
    // First priority: Look for "Product Image" column with more flexible matching
    for (const key of allKeys) {
      const trimmedKey = key.trim();
      const lowerKey = trimmedKey.toLowerCase();
      
      // More flexible matching for "Product Image" - handles spaces, dashes, underscores, extra spaces
      const normalizedKey = lowerKey.replace(/\s+/g, ' ').trim();
      const isProductImage = lowerKey === 'product image' || 
                            trimmedKey === 'Product Image' ||
                            trimmedKey === 'PRODUCT IMAGE' ||
                            lowerKey === 'productimage' ||
                            lowerKey === 'product_image' ||
                            lowerKey === 'product-image' ||
                            normalizedKey === 'product image' ||
                            lowerKey.replace(/\s+/g, '') === 'productimage';
      
      if (isProductImage) {
        const value = combination[key];
        console.log(`   Checking "Product Image" column "${key}":`, value, `(type: ${typeof value}, raw:`, JSON.stringify(value), ')');
        
        // More thorough null/empty checking
        if (value !== null && value !== undefined && value !== '') {
          const stringValue = String(value).trim();
          // Check for string "null", "undefined", empty strings, "N/A"
          if (stringValue !== '' && 
              stringValue.toLowerCase() !== 'null' && 
              stringValue.toLowerCase() !== 'undefined' &&
              stringValue !== 'N/A' &&
              stringValue !== 'n/a' &&
              stringValue !== 'NA' &&
              stringValue !== 'na') {
            pumpImage = stringValue;
            imageColumnName = key;
            console.log(`   ✅ Found product image in column "${key}": "${pumpImage}"`);
            break;
          } else {
            console.log(`   ⚠️ Column "${key}" exists but value is empty/null/invalid:`, stringValue);
          }
        } else {
          console.log(`   ⚠️ Column "${key}" exists but value is null/undefined/empty:`, value);
        }
      }
    }
    
    // Second priority: Look for column S or other image-related columns if "Product Image" not found
    if (!pumpImage) {
      for (const key of allKeys) {
        const trimmedKey = key.trim();
        const lowerKey = trimmedKey.toLowerCase();
        
        // Check if this is column S (exact match or contains 's' as column identifier)
        const isColumnS = trimmedKey === 'S' || 
                          lowerKey === 's' || 
                          lowerKey === 'column s' || 
                          lowerKey === 'columns' ||
                          trimmedKey === 'Column S' ||
                          trimmedKey === 'COLUMN S' ||
                          trimmedKey === ' S ';
        
        // Check for other image columns (but not "Product Image" which we already checked)
        const isOtherImageColumn = !lowerKey.includes('product image') &&
                                   !lowerKey.includes('productimage') &&
                                   lowerKey.includes('image') && 
                                   !lowerKey.includes('combination');
        
        if (isColumnS || isOtherImageColumn) {
          const value = combination[key];
          console.log(`   Checking image column "${key}":`, value, `(type: ${typeof value}, raw:`, JSON.stringify(value), ')');
          
          // More thorough null/empty checking
          if (value !== null && value !== undefined && value !== '') {
            const stringValue = String(value).trim();
            if (stringValue !== '' && 
                stringValue.toLowerCase() !== 'null' && 
                stringValue.toLowerCase() !== 'undefined' &&
                stringValue !== 'N/A' &&
                stringValue !== 'n/a' &&
                stringValue !== 'NA' &&
                stringValue !== 'na') {
              pumpImage = stringValue;
              imageColumnName = key;
              console.log(`   ✅ Found image in column "${key}": "${pumpImage}"`);
              break;
            } else {
              console.log(`   ⚠️ Column "${key}" exists but value is empty/null/invalid:`, stringValue);
            }
          } else {
            console.log(`   ⚠️ Column "${key}" exists but value is null/undefined/empty:`, value);
          }
        }
      }
    }
    
    if (!pumpImage) {
      console.log('   ⚠️ No product image found. Searched for "Product Image", column S, and other image columns.');
      console.log('   Available columns:', allKeys);
      // Show sample data for first few columns to help debug
      const sampleData = {};
      allKeys.slice(0, 5).forEach(key => {
        sampleData[key] = combination[key];
      });
      console.log('   Sample combination data (first 5 columns):', sampleData);
    }
    
    // Extract columns K-S (all columns except matching fields, Model, HP, SKU, and Image column S)
    const excludedColumns = new Set([
      'Purpose', 'purpose', 'PURPOSE',
      'Location', 'location', 'LOCATION',
      'Source', 'source', 'SOURCE',
      'Water Level', 'WaterLevel', 'waterLevel', 'water level', 'WATER LEVEL',
      'Delivery', 'delivery', 'DELIVERY',
      'Custom Height', 'CustomHeight', 'customHeight', 'custom height', 'CUSTOM HEIGHT',
      'Usage', 'usage', 'USAGE',
      'Phase', 'phase', 'PHASE',
      'Quality', 'quality', 'QUALITY',
      'Combination #', 'Combination', 'combination', 'Combination Number',
      'MODEL', 'Model', 'model', 'Model Name', 'ModelName', ' MODEL ', ' MODEL', 'MODEL ',
      'HP', 'hp', 'Horsepower', 'horsepower', 'HORSEPOWER', ' HP ', ' HP', 'HP ',
      'SKU', 'sku', 'Sku', ' SKU ', ' SKU', 'SKU '
    ]);
    
    // Get all additional columns (K-S or any other columns, excluding the image column)
    const additionalColumns = [];
    
    allKeys.forEach(key => {
      const trimmedKey = key.trim();
      const lowerKey = trimmedKey.toLowerCase();
      
      // Skip the image column (Product Image or column S) - it will be displayed separately
      if (key === imageColumnName || 
          trimmedKey === 'S' || 
          lowerKey === 's' || 
          lowerKey === 'column s' ||
          lowerKey === 'product image' ||
          trimmedKey === 'Product Image' ||
          lowerKey === 'productimage') {
        return;
      }
      
      // Check if this column should be excluded
      let isExcluded = false;
      excludedColumns.forEach(excluded => {
        if (lowerKey === excluded.toLowerCase() || lowerKey.includes(excluded.toLowerCase())) {
          // Special check for Model and HP
          if (excluded.toLowerCase().includes('model') && lowerKey.includes('model')) {
            isExcluded = true;
          } else if (excluded.toLowerCase().includes('hp') && (lowerKey === 'hp' || lowerKey === 'horsepower')) {
            isExcluded = true;
          } else if (lowerKey === excluded.toLowerCase()) {
            isExcluded = true;
          }
        }
      });
      
      // Also exclude if it's a matching field
      const matchingFields = ['purpose', 'location', 'source', 'water', 'delivery', 'custom', 'usage', 'phase', 'quality', 'combination'];
      if (matchingFields.some(field => lowerKey.includes(field))) {
        isExcluded = true;
      }
      
      if (!isExcluded) {
        const value = combination[key];
        if (value !== null && value !== undefined && value !== '') {
          const stringValue = String(value).trim();
          if (stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined') {
            additionalColumns.push({
              name: key,
              value: stringValue
            });
          }
        }
      }
    });
    
    // Sort columns alphabetically for consistent display
    additionalColumns.sort((a, b) => a.name.localeCompare(b.name));
    
    // Generate unique ID for this recommendation card
    const recommendationId = 'pump-recommendation-' + Date.now();
    
    // Format date and time for PDF
    const currentDate = new Date();
    const dateTimeString = currentDate.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `
      <div id="${recommendationId}" class="pump-recommendation" style="background: linear-gradient(135deg, #e6f7ff 0%, #bae6fd 100%); padding: 0; border-radius: 20px; margin-top: 30px; box-shadow: 0 15px 50px rgba(0,51,102,0.25); overflow: hidden; position: relative; border: 3px solid #003366;">
        
        <!-- Havells Logo at Top -->
        <div style="background: linear-gradient(135deg, #003366 0%, #0055aa 100%); padding: 30px; text-align: center; position: relative;">
          <img src="pumpimages/havels.png" alt="Havells Logo" class="havells-logo" style="width: 180px; height: auto; background: white; padding: 15px; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.25); border: 3px solid #ffffff; margin-bottom: 20px;" onerror="this.style.display='none'; console.warn('Havells logo failed to load');">
        </div>
        
        <!-- Model Name and Image Side by Side -->
        <div style="background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); padding: 50px 40px; display: flex; align-items: center; gap: 40px; flex-wrap: wrap;">
          <!-- Left Side: Model Name -->
          <div style="flex: 1; min-width: 300px; text-align: left;">
            <div style="background: linear-gradient(135deg, #003366 0%, #0055aa 100%); padding: 40px 35px; border-radius: 16px; color: white; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
              <h1 style="color: #ffffff; margin: 0; font-size: 3em; font-weight: 900; text-shadow: 3px 3px 8px rgba(0,0,0,0.4); letter-spacing: -1px; line-height: 1.2;">
                ${model}
              </h1>
              ${hp ? `<p style="color: rgba(255,255,255,0.95); margin: 20px 0 0 0; font-size: 1.5em; font-weight: 600; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${hp} HP</p>` : ''}
            </div>
          </div>
          
          <!-- Right Side: Product Image -->
          ${pumpImage ? `
          <div style="flex: 1; min-width: 300px; text-align: center; position: relative;">
            <div style="position: relative; display: inline-block; max-width: 100%;">
              <!-- Product Image -->
              <img src="${pumpImage}" alt="Pump Model ${model}" class="product-image" style="max-width: 100%; max-height: 500px; height: auto; border-radius: 16px; box-shadow: 0 12px 35px rgba(0,0,0,0.3); background: white; padding: 25px; border: 4px solid #003366;" 
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block'; console.warn('Product image failed to load:', '${pumpImage}');">
              
              <div style="display: none; color: #dc2626; padding: 25px; background: #fee2e2; border-radius: 10px; border: 3px solid #dc2626; margin-top: 25px;">
                ⚠️ Image not found: ${pumpImage}
              </div>
            </div>
          </div>
          ` : ''}
        </div>
        
        <div style="padding: 40px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);">
          
          <!-- Product Information Section -->
          <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 35px; border-radius: 16px; margin-bottom: 30px; border: 3px solid #3b82f6; box-shadow: 0 8px 25px rgba(59,130,246,0.2);">
            <h3 style="color: #1e40af; margin-bottom: 30px; font-size: 2em; font-weight: 800; text-align: center; text-shadow: 1px 1px 3px rgba(0,0,0,0.1);">📦 Product Information</h3>
            
            <!-- Key Information Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 25px; margin-bottom: 30px;">
              ${sku ? `
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 25px; border-radius: 14px; border: 3px solid #10b981; box-shadow: 0 6px 18px rgba(16,185,129,0.25); transition: transform 0.3s ease;" onmouseover="this.style.transform='translateY(-8px) scale(1.02)';" onmouseout="this.style.transform='translateY(0) scale(1)';">
                <div style="color: #047857; font-size: 1em; margin-bottom: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">SKU</div>
                <div style="color: #065f46; font-size: 2em; font-weight: 900;">${sku}</div>
              </div>
              ` : ''}
              ${productCode ? `
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 14px; border: 3px solid #f59e0b; box-shadow: 0 6px 18px rgba(245,158,11,0.25); transition: transform 0.3s ease;" onmouseover="this.style.transform='translateY(-8px) scale(1.02)';" onmouseout="this.style.transform='translateY(0) scale(1)';">
                <div style="color: #92400e; font-size: 1em; margin-bottom: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Product Code</div>
                <div style="color: #78350f; font-size: 2em; font-weight: 900;">${productCode}</div>
              </div>
              ` : ''}
              ${series ? `
              <div style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); padding: 25px; border-radius: 14px; border: 3px solid #ec4899; box-shadow: 0 6px 18px rgba(236,72,153,0.25); transition: transform 0.3s ease;" onmouseover="this.style.transform='translateY(-8px) scale(1.02)';" onmouseout="this.style.transform='translateY(0) scale(1)';">
                <div style="color: #be185d; font-size: 1em; margin-bottom: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Series</div>
                <div style="color: #9f1239; font-size: 2em; font-weight: 900;">${series}</div>
              </div>
              ` : ''}
              ${power ? `
              <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 25px; border-radius: 14px; border: 3px solid #6366f1; box-shadow: 0 6px 18px rgba(99,102,241,0.25); transition: transform 0.3s ease;" onmouseover="this.style.transform='translateY(-8px) scale(1.02)';" onmouseout="this.style.transform='translateY(0) scale(1)';">
                <div style="color: #4338ca; font-size: 1em; margin-bottom: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Power</div>
                <div style="color: #312e81; font-size: 2em; font-weight: 900;">${power}</div>
              </div>
              ` : ''}
            </div>
            
            <!-- Additional Specifications -->
            ${additionalColumns.length > 0 ? `
              <div style="margin-top: 35px;">
                <h4 style="color: #1e40af; margin-bottom: 25px; font-size: 1.6em; font-weight: 800; border-bottom: 3px solid #3b82f6; padding-bottom: 12px;">📊 Additional Specifications</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                  ${additionalColumns.map(col => `
                    <div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 20px; border-radius: 12px; border-left: 5px solid #3b82f6; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s ease;" onmouseover="this.style.transform='translateX(8px)';" onmouseout="this.style.transform='translateX(0)';">
                      <div style="font-weight: 800; color: #1e40af; margin-bottom: 12px; font-size: 1.05em; text-transform: capitalize;">
                        ${col.name}
                      </div>
                      <div style="color: #1e293b; font-size: 1.1em; word-break: break-word; font-weight: 600;">
                        ${col.value}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
            
            <!-- Selection Summary -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 35px; border-radius: 16px; border: 3px solid #10b981; box-shadow: 0 8px 25px rgba(16,185,129,0.2);">
              <h4 style="color: #047857; margin-bottom: 25px; font-size: 1.8em; font-weight: 800; border-bottom: 3px solid #10b981; padding-bottom: 12px;">📋 Your Selection Summary</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px;">
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-left: 4px solid #10b981;">
                  <div style="color: #64748b; font-size: 0.9em; margin-bottom: 6px; font-weight: 700;">Installation Purpose</div>
                  <div style="color: #1e293b; font-size: 1.05em; font-weight: 700;">${formatSelectionValue('purpose', formData.purpose)}</div>
                </div>
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-left: 4px solid #10b981;">
                  <div style="color: #64748b; font-size: 0.9em; margin-bottom: 6px; font-weight: 700;">Pump Type Required</div>
                  <div style="color: #1e293b; font-size: 1.05em; font-weight: 700;">${formatSelectionValue('location', formData.location)}</div>
                </div>
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-left: 4px solid #10b981;">
                  <div style="color: #64748b; font-size: 0.9em; margin-bottom: 6px; font-weight: 700;">Water Source</div>
                  <div style="color: #1e293b; font-size: 1.05em; font-weight: 700;">${formatSelectionValue('source', formData.source)}</div>
                </div>
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-left: 4px solid #10b981;">
                  <div style="color: #64748b; font-size: 0.9em; margin-bottom: 6px; font-weight: 700;">Water Level Depth</div>
                  <div style="color: #1e293b; font-size: 1.05em; font-weight: 700;">${formatSelectionValue('waterLevel', formData.waterLevel)}</div>
                </div>
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-left: 4px solid #10b981;">
                  <div style="color: #64748b; font-size: 0.9em; margin-bottom: 6px; font-weight: 700;">${formData.faucets ? 'Faucets' : 'Delivery Location'}</div>
                  <div style="color: #1e293b; font-size: 1.05em; font-weight: 700;">${formData.faucets ? formData.faucets : formData.delivery}</div>
                </div>
                ${formData.customHeight ? `
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-left: 4px solid #10b981;">
                  <div style="color: #64748b; font-size: 0.9em; margin-bottom: 6px; font-weight: 700;">Custom Height</div>
                  <div style="color: #1e293b; font-size: 1.05em; font-weight: 700;">${formatSelectionValue('customHeight', formData.customHeight)}</div>
                </div>
                ` : ''}
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-left: 4px solid #10b981;">
                  <div style="color: #64748b; font-size: 0.9em; margin-bottom: 6px; font-weight: 700;">Water Requirement</div>
                  <div style="color: #1e293b; font-size: 1.05em; font-weight: 700;">${formatSelectionValue('usage', formData.usage)}</div>
                </div>
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-left: 4px solid #10b981;">
                  <div style="color: #64748b; font-size: 0.9em; margin-bottom: 6px; font-weight: 700;">Power Voltage Required</div>
                  <div style="color: #1e293b; font-size: 1.05em; font-weight: 700;">${formatSelectionValue('phase', formData.phase)}</div>
                </div>
                <div style="background: white; padding: 18px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-left: 4px solid #10b981;">
                  <div style="color: #64748b; font-size: 0.9em; margin-bottom: 6px; font-weight: 700;">Quality Preference</div>
                  <div style="color: #1e293b; font-size: 1.05em; font-weight: 700;">${formatSelectionValue('quality', formData.quality)}</div>
                </div>
              </div>
            </div>
            
            <!-- Date and Time Footer -->
            <div style="margin-top: 35px; padding: 25px; background: linear-gradient(135deg, #003366 0%, #0055aa 100%); border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              <p style="color: rgba(255,255,255,0.95); font-size: 1em; margin: 0; font-weight: 600;">
                Generated on: <strong style="color: #ffffff; font-size: 1.1em;">${dateTimeString}</strong>
              </p>
            </div>
            
            <!-- Print Button at Bottom -->
            <div class="print-button-container" style="margin-top: 30px; text-align: center; padding-bottom: 20px;">
              <button id="print-btn-${recommendationId}" onclick="printPumpRecommendation('${recommendationId}', '${model}', '${dateTimeString}', this)" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; border: none; padding: 16px 40px; border-radius: 12px; font-size: 1.2em; font-weight: 700; cursor: pointer; box-shadow: 0 8px 25px rgba(255,107,107,0.4); transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 12px;" onmouseover="this.style.transform='translateY(-3px) scale(1.05)'; this.style.boxShadow='0 10px 30px rgba(255,107,107,0.5)';" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(255,107,107,0.4)';">
                🖨️ Print File
              </button>
              <!-- Progress Bar -->
              <div id="progress-container-${recommendationId}" style="display: none; margin-top: 20px; max-width: 400px; margin-left: auto; margin-right: auto;">
                <div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                  <div id="progress-bar-${recommendationId}" style="background: linear-gradient(90deg, #10b981 0%, #059669 100%); height: 100%; width: 0%; transition: width 0.3s ease; border-radius: 10px; box-shadow: 0 2px 4px rgba(16,185,129,0.3);"></div>
                </div>
                <p id="progress-text-${recommendationId}" style="color: #6b7280; font-size: 0.9em; margin-top: 8px; font-weight: 600;">Preparing PDF...</p>
              </div>
            </div>
        </div>
      </div>
    `;
  }

  // 📊 Generate Results HTML (Optimized)
  function generateResultsHTML(matches, requirements, formData = {}) {
    const { head, flow, hp, voltage } = requirements;
    const flowLPM = Math.round(flow / 60);
    
    let html = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px; margin-top: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #ffffff; margin-bottom: 10px; font-size: 2em; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); font-weight: 700;">🔍 Pump Recommendations</h2>
          <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-top: 20px; border: 1px solid rgba(255,255,255,0.3);">
            <h3 style="color: #ffffff; margin-bottom: 15px; font-size: 1.3em; font-weight: 600;">📋 Your Requirements</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
              <div style="background: rgba(255,255,255,0.95); padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="color: #667eea; font-size: 0.85em; font-weight: 600; margin-bottom: 5px;">Head</div>
                <div style="color: #333; font-size: 1.4em; font-weight: bold;">${Math.round(head)} ft</div>
              </div>
              <div style="background: rgba(255,255,255,0.95); padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="color: #667eea; font-size: 0.85em; font-weight: 600; margin-bottom: 5px;">Flow</div>
                <div style="color: #333; font-size: 1.4em; font-weight: bold;">${flowLPM} LPM</div>
              </div>
              <div style="background: rgba(255,255,255,0.95); padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="color: #667eea; font-size: 0.85em; font-weight: 600; margin-bottom: 5px;">HP</div>
                <div style="color: #333; font-size: 1.4em; font-weight: bold;">~${hp}</div>
              </div>
              <div style="background: rgba(255,255,255,0.95); padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="color: #667eea; font-size: 0.85em; font-weight: 600; margin-bottom: 5px;">Voltage</div>
                <div style="color: #333; font-size: 1.4em; font-weight: bold;">${voltage}V</div>
              </div>
            </div>
          </div>
        </div>
    `;

    if (matches.length > 0) {
      html += '<div style="margin-top: 25px;">';
      html += '<h3 style="color: #ffffff; margin-bottom: 20px; font-size: 1.5em; text-align: center; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">🎯 Recommended Pumps</h3>';
      
      // Pre-define compatibility configs
      const compatibilityConfig = (score) => {
        if (score >= 80) return { color: '#10b981', bgColor: '#d1fae5', badge: '🟢 Excellent Match', icon: '⭐' };
        if (score >= 60) return { color: '#f59e0b', bgColor: '#fef3c7', badge: '🟡 Good Match', icon: '✓' };
        if (score >= 40) return { color: '#f97316', bgColor: '#fed7aa', badge: '🟠 Fair Match', icon: '→' };
        return { color: '#ef4444', bgColor: '#fee2e2', badge: '🔴 Basic Match', icon: '◯' };
      };
      
      // Build HTML efficiently
      matches.forEach((pump, index) => {
        const config = compatibilityConfig(pump.compatibility);
        const isBestMatch = index === 0;
        const isExactMatch = pump.matchType === 'exact' || pump.accuracy === 100;
        const cardBg = isBestMatch ? (isExactMatch ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)') : '#ffffff';
        const borderColor = isExactMatch ? '#10b981' : isBestMatch ? '#3b82f6' : '#e5e7eb';
        const borderWidth = isExactMatch ? '3px' : isBestMatch ? '2px' : '1px';
        
        html += `
          <div style="background: ${cardBg}; border: ${borderWidth} solid ${borderColor}; border-radius: 14px; padding: 25px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease, box-shadow 0.3s ease;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)';">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
              <div style="flex: 1; min-width: 250px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                  <span style="background: ${borderColor}; color: white; padding: 8px 14px; border-radius: 20px; font-weight: bold; font-size: 1.1em; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">#${index + 1}</span>
                  ${isExactMatch ? '<span style="background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">✅ 100% Match</span>' : isBestMatch ? '<span style="background: #3b82f6; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">⭐ Best Match</span>' : ''}
                </div>
                <h4 style="color: #1f2937; margin-bottom: 5px; font-size: 1.5em; font-weight: 700; line-height: 1.3;">${pump.model}</h4>
                ${pump.productCode ? `<p style="color: #6b7280; margin: 5px 0; font-size: 0.95em;"><strong>Product Code:</strong> <span style="color: #4b5563; font-weight: 600;">${pump.productCode}</span></p>` : ''}
              </div>
              <div style="background: ${config.bgColor}; padding: 12px 18px; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); min-width: 140px;">
                <div style="color: ${config.color}; font-size: 0.9em; font-weight: 600; margin-bottom: 5px;">${config.badge}</div>
                <div style="color: ${config.color}; font-size: 1.8em; font-weight: bold;">${pump.compatibility}%</div>
                <div style="color: #6b7280; font-size: 0.75em; margin-top: 3px;">Compatibility</div>
              </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.7); padding: 18px; border-radius: 10px; margin-bottom: 15px; backdrop-filter: blur(10px);">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.3em;">⚡</span>
                  <div>
                    <div style="color: #6b7280; font-size: 0.85em; font-weight: 500;">Series</div>
                    <div style="color: #1f2937; font-size: 1.05em; font-weight: 600;">${pump.series || 'N/A'}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.3em;">🔧</span>
                  <div>
                    <div style="color: #6b7280; font-size: 0.85em; font-weight: 500;">HP</div>
                    <div style="color: #1f2937; font-size: 1.05em; font-weight: 600;">${pump.hp || 'N/A'}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.3em;">⚙️</span>
                  <div>
                    <div style="color: #6b7280; font-size: 0.85em; font-weight: 500;">Power</div>
                    <div style="color: #1f2937; font-size: 1.05em; font-weight: 600;">${pump.powerKw || 'N/A'}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.3em;">🔌</span>
                  <div>
                    <div style="color: #6b7280; font-size: 0.85em; font-weight: 500;">Voltage</div>
                    <div style="color: #1f2937; font-size: 1.05em; font-weight: 600;">${pump.voltage || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.7); padding: 18px; border-radius: 10px; margin-bottom: 15px; backdrop-filter: blur(10px);">
              <div style="color: #4b5563; font-size: 0.9em; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Performance Specifications</div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                <div style="text-align: center; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <div style="color: #6b7280; font-size: 0.8em; margin-bottom: 5px;">Head</div>
                  <div style="color: #667eea; font-size: 1.3em; font-weight: bold;">${Math.round(pump.headMax || 0)} ft</div>
                </div>
                <div style="text-align: center; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <div style="color: #6b7280; font-size: 0.8em; margin-bottom: 5px;">Flow</div>
                  <div style="color: #667eea; font-size: 1.3em; font-weight: bold;">${Math.round((pump.flowMax || 0)/60)} LPM</div>
                </div>
              </div>
            </div>
            
            ${pump.application ? `
            <div style="background: rgba(255,255,255,0.7); padding: 12px 18px; border-radius: 10px; backdrop-filter: blur(10px);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2em;">🎯</span>
                <div>
                  <div style="color: #6b7280; font-size: 0.85em; font-weight: 500;">Application</div>
                  <div style="color: #1f2937; font-size: 1em; font-weight: 600;">${pump.application}</div>
                </div>
              </div>
            </div>
            ` : ''}
            
            <div style="background: ${config.bgColor}; padding: 15px; border-radius: 10px; margin-top: 15px;">
              <div style="color: ${config.color}; font-weight: 600; margin-bottom: 10px; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px;">Match Score Breakdown</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div style="background: white; padding: 8px; border-radius: 6px; text-align: center;">
                  <div style="color: #6b7280; font-size: 0.75em; margin-bottom: 3px;">Head</div>
                  <div style="color: ${config.color}; font-weight: bold; font-size: 1.1em;">${pump.headScore || 0}%</div>
                </div>
                <div style="background: white; padding: 8px; border-radius: 6px; text-align: center;">
                  <div style="color: #6b7280; font-size: 0.75em; margin-bottom: 3px;">Flow</div>
                  <div style="color: ${config.color}; font-weight: bold; font-size: 1.1em;">${pump.flowScore || 0}%</div>
                </div>
                <div style="background: white; padding: 8px; border-radius: 6px; text-align: center;">
                  <div style="color: #6b7280; font-size: 0.75em; margin-bottom: 3px;">HP</div>
                  <div style="color: ${config.color}; font-weight: bold; font-size: 1.1em;">${pump.hpScore || 0}%</div>
                </div>
                <div style="background: white; padding: 8px; border-radius: 6px; text-align: center;">
                  <div style="color: #6b7280; font-size: 0.75em; margin-bottom: 3px;">Voltage</div>
                  <div style="color: ${config.color}; font-weight: bold; font-size: 1.1em;">${pump.voltageScore || 0}%</div>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
    } else {
      if (combinationDatabase.length > 0) {
        // No exact match found in combination database
        html += `
          <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #ef4444; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 3em; margin-bottom: 10px;">❌</div>
              <h3 style="color: #c62828; margin-bottom: 10px; font-size: 1.5em; font-weight: 700;">No Exact Match Found</h3>
            </div>
            <p style="color: #991b1b; margin-bottom: 15px; font-size: 1.05em; line-height: 1.6;">We couldn't find an exact combination match for your selections in the database.</p>
            <div style="background: white; padding: 20px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <p style="color: #1f2937; margin-bottom: 12px; font-weight: 600; font-size: 1.05em;">📋 Your Selection Summary:</p>
              <ul style="color: #4b5563; margin: 0; padding-left: 25px; line-height: 2;">
                <li><strong>Installation Purpose:</strong> ${formatSelectionValue('purpose', formData.purpose)}</li>
                <li><strong>Pump Type Required:</strong> ${formatSelectionValue('location', formData.location)}</li>
                <li><strong>Water Source:</strong> ${formatSelectionValue('source', formData.source)}</li>
                <li><strong>Water Level Depth:</strong> ${formatSelectionValue('waterLevel', formData.waterLevel)}</li>
                <li><strong>Delivery Location:</strong> ${formatSelectionValue('delivery', formData.delivery)}</li>
                ${formData.customHeight ? `<li><strong>Custom Height:</strong> ${formatSelectionValue('customHeight', formData.customHeight)}</li>` : ''}
                <li><strong>Water Requirement:</strong> ${formatSelectionValue('usage', formData.usage)}</li>
                <li><strong>Power Voltage Required:</strong> ${formatSelectionValue('phase', formData.phase)}</li>
                <li><strong>Quality Preference:</strong> ${formatSelectionValue('quality', formData.quality)}</li>
              </ul>
            </div>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #ef4444;">
              <p style="color: #991b1b; margin: 0; font-size: 0.95em; line-height: 1.6;">
                <strong>💡 Note:</strong> Please ensure all fields are correctly selected, or contact support if you believe this combination should exist.
              </p>
            </div>
          </div>
        `;
      } else {
        html += `
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 3em; margin-bottom: 10px;">⚠️</div>
              <h3 style="color: #92400e; margin-bottom: 10px; font-size: 1.5em; font-weight: 700;">No Exact Matches Found</h3>
            </div>
            <p style="color: #78350f; margin-bottom: 15px; font-size: 1.05em; line-height: 1.6;">We couldn't find pumps that exactly match your requirements. Consider:</p>
            <ul style="color: #78350f; padding-left: 25px; line-height: 2.2; font-size: 1.05em;">
              <li>📊 Adjusting your flow or head requirements</li>
              <li>📞 Contacting our technical support for custom solutions</li>
              <li>⚡ Using a pump with higher specifications</li>
            </ul>
          </div>
        `;
      }
    }

    html += `
      <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 15px; border-radius: 10px; margin-top: 25px; border: 1px solid rgba(255,255,255,0.2); text-align: center;">
        <p style="color: #ffffff; margin: 0; font-size: 0.95em; font-weight: 500; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
          💡 Recommendations based on your inputs and Havells pump specifications
        </p>
      </div>
    </div>
    `;

    return html;
  }

  // 📝 Event Listeners
  if (simpleBtn) simpleBtn.onclick = () => setMode('simple');
  if (advancedBtn) advancedBtn.onclick = () => setMode('advanced');

  // Add change listeners to remove error indicators when user selects
  function addErrorRemovalListeners() {
    // Use event delegation on the form to handle dynamically created selects
    if (form) {
      form.addEventListener('change', function(e) {
        if (e.target.tagName === 'SELECT' && e.target.value && e.target.value !== '') {
          showFieldError(e.target, false);
        }
      });
      
      form.addEventListener('input', function(e) {
        if (e.target.type === 'number' && e.target.value && e.target.value !== '' && !isNaN(parseFloat(e.target.value))) {
          const existingError = e.target.parentElement.querySelector('.field-error-indicator');
          if (existingError) existingError.remove();
          e.target.style.border = '';
          e.target.style.borderRadius = '';
        }
      });
    }
  }

  if (sourceSelect) sourceSelect.addEventListener('change', toggleWaterLevel);
  if (deliverySelect) deliverySelect.addEventListener('change', toggleCustomHeight);
  
  // Initialize error removal listeners
  addErrorRemovalListeners();

  if (purposeSelect) purposeSelect.addEventListener('change', filterLocationByPurpose);
  if (locationSelect) locationSelect.addEventListener('change', filterByLocation);

  // Function to show/hide error indicator for a select field
  function showFieldError(selectElement, show) {
    if (!selectElement) return;
    
    // Remove existing error indicator
    const existingError = selectElement.parentElement.querySelector('.field-error-indicator');
    if (existingError) {
      existingError.remove();
    }
    
    if (show) {
      // Create error indicator
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error-indicator';
      errorDiv.style.cssText = `
        background-color: #ff4444;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        margin-bottom: 8px;
        font-size: 0.9em;
        font-weight: bold;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;
      errorDiv.textContent = 'Select option in this field (इस फ़ील्ड में विकल्प चुनें)';
      
      // Insert before the select element
      selectElement.parentElement.insertBefore(errorDiv, selectElement);
      
      // Add red border to select
      selectElement.style.border = '2px solid #ff4444';
      selectElement.style.borderRadius = '4px';
    } else {
      // Remove red border
      selectElement.style.border = '';
      selectElement.style.borderRadius = '';
    }
  }

  // Function to validate all visible required fields
  function validateForm() {
    const errors = [];
    const isSimple = simpleMode && simpleMode.style.display !== 'none';
    
    // Get all visible select elements in the active mode
    const activeMode = isSimple ? simpleMode : advancedMode;
    const allSelects = activeMode ? activeMode.querySelectorAll('select') : form.querySelectorAll('select');
    
    // Clear all previous errors
    document.querySelectorAll('.field-error-indicator').forEach(el => el.remove());
    form.querySelectorAll('select').forEach(sel => {
      sel.style.border = '';
      sel.style.borderRadius = '';
    });
    
    // Check each visible select field
    allSelects.forEach(select => {
      // Skip if hidden
      if (select.offsetParent === null || select.style.display === 'none') {
        return;
      }
      
      // Skip custom height if not shown
      if (select.name === 'customHeight' && (!heightDropdownBox || heightDropdownBox.style.display === 'none')) {
        return;
      }
      
      // Skip construction source if not shown (but check if it IS shown)
      if (select.id === 'constructionSourceSelect') {
        if (!constructionSourceSelect || constructionSourceSelect.style.display === 'none') {
          return;
        }
        // If construction source IS visible, validate it
      }
      
      // Skip water level if hidden (pressure mode)
      if (select.name === 'waterLevel' && (!waterLevelSelect || waterLevelSelect.style.display === 'none')) {
        return;
      }
      
      // Skip usage if hidden (pressure mode)
      if (select.name === 'usage' && (!usageSelect || usageSelect.style.display === 'none')) {
        return;
      }
      
      // Skip location if hidden (construction mode)
      if (select.name === 'location' && (!locationSelect || locationSelect.style.display === 'none')) {
        return;
      }
      
      // Check if field has empty value - read directly from DOM
      const value = select.value || '';
      if (value === '' || value === null || value === undefined) {
        // Get label text
        let labelText = 'Field';
        const label = select.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
          labelText = label.textContent.split('(')[0].trim();
        } else if (select.id) {
          labelText = select.id;
        } else if (select.name) {
          labelText = select.name;
        }
        
        errors.push({ field: select.name || select.id, label: labelText, element: select });
        showFieldError(select, true);
      } else {
        showFieldError(select, false);
      }
    });
    
    // Also validate number inputs in advanced mode
    if (!isSimple && advancedMode) {
      const numberInputs = advancedMode.querySelectorAll('input[type="number"]');
      numberInputs.forEach(input => {
        if (input.offsetParent !== null && input.style.display !== 'none') {
          const value = input.value || '';
          if (value === '' || value === null || value === undefined || isNaN(parseFloat(value))) {
            let labelText = 'Field';
            const label = input.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
              labelText = label.textContent.split('(')[0].trim();
            }
            errors.push({ field: input.name || input.id, label: labelText, element: input });
            
            // Show error for input too
            const existingError = input.parentElement.querySelector('.field-error-indicator');
            if (existingError) existingError.remove();
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error-indicator';
            errorDiv.style.cssText = `
              background-color: #ff4444;
              color: white;
              padding: 8px 12px;
              border-radius: 4px;
              margin-bottom: 8px;
              font-size: 0.9em;
              font-weight: bold;
              text-align: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            errorDiv.textContent = 'Enter value in this field (इस फ़ील्ड में मान दर्ज करें)';
            input.parentElement.insertBefore(errorDiv, input);
            input.style.border = '2px solid #ff4444';
            input.style.borderRadius = '4px';
          }
        }
      });
    }
    
    return errors;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validate all fields
      const errors = validateForm();
      
      if (errors.length > 0) {
        // Scroll to first error
        if (errors[0].element) {
          errors[0].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      
      // Get form data after validation passes
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      // Also get values directly from DOM to ensure we have all values
      const isSimple = simpleMode && simpleMode.style.display !== 'none';
      const activeMode = isSimple ? simpleMode : advancedMode;
      const allSelects = activeMode ? activeMode.querySelectorAll('select') : form.querySelectorAll('select');
      
      allSelects.forEach(select => {
        if (select.offsetParent !== null && select.style.display !== 'none') {
          if (select.value) {
            data[select.name || select.id] = select.value;
          }
        }
      });
      
      // Also get input values
      const allInputs = activeMode ? activeMode.querySelectorAll('input[type="number"]') : form.querySelectorAll('input[type="number"]');
      allInputs.forEach(input => {
        if (input.offsetParent !== null && input.style.display !== 'none') {
          if (input.value) {
            data[input.name || input.id] = input.value;
          }
        }
      });
      
      // Normalize field names to match database columns for exact matching
      const normalizedData = {
        purpose: (data.purpose || '').trim(),
        location: (data.location || '').trim(),
        source: (data.source || '').trim(),
        waterLevel: (data.waterLevel || data['waterLevel'] || '').trim(),
        delivery: (data.delivery || '').trim(),
        customHeight: (data.customHeight || data['customHeight'] || '').trim(),
        usage: (data.usage || '').trim(),
        phase: (data.phase || '').trim(),
        quality: (data.quality || '').trim()
      };
      
      console.log('📋 Form data collected:', data);
      console.log('📋 Normalized data for matching:', normalizedData);
      
      // Determine mode for saving
      const currentMode = simpleMode && simpleMode.style.display !== 'none' ? 'simple' : 'advanced';
      
      // Save to database before getting recommendation
      try {
        const selectionId = await pumpDB.saveSelection({
          ...data,
          mode: currentMode,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
        
        console.log('Selection saved with ID:', selectionId);
        
        // Get recommendation and save it (use normalized data for exact matching)
        const recommendations = await getRecommendation(normalizedData);
        if (recommendations && selectionId) {
          await pumpDB.saveRecommendation(selectionId, recommendations);
        }
      } catch (error) {
        console.error('Error saving to database:', error);
        // Continue with recommendation even if database save fails
        await getRecommendation(normalizedData);
      }
    });

    const resetBtn = form.querySelector('button[type="reset"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        // Allow form.reset() to run first, then blank out all selects/fields
        setTimeout(() => {
          // Clear recommendations
          if (resultBox) {
            resultBox.innerHTML = '';
            resultBox.style.display = 'none';
          }

          // Restore delivery to original (non-faucet)
          if (deliveryLabel) deliveryLabel.textContent = 'Where do you want the water to reach (पानी कहाँ तक पहुंचाना है)';
          if (deliverySelect) {
            deliverySelect.innerHTML = `
              <option value="">Select delivery location (पानी पहुंचाने की जगह चुनें)</option>
              <option value="ground">Ground level (जमीन स्तर)</option>
              <option value="floor1">1st floor (~10 ft) (पहली मंजिल)</option>
              <option value="floor2">2nd floor (~20 ft) (दूसरी मंजिल)</option>
              <option value="floor3">3rd floor (~30 ft) (तीसरी मंजिल)</option>
              <option value="floor4">4th floor (~40 ft) (चौथी मंजिल)</option>
              <option value="custom">Above 4th floor (चौथी मंजिल से ऊपर)</option>
            `;
            deliverySelect.name = 'delivery';
          }

          // Show usage and water level sections
          if (usageSelect) usageSelect.style.display = 'block';
          if (usageLabel) usageLabel.style.display = 'block';
          if (waterLevelSelect) waterLevelSelect.style.display = 'block';
          if (waterLevelLabel) waterLevelLabel.style.display = 'block';
          if (heightDropdownBox) heightDropdownBox.style.display = 'none';

          // Blank out all selects in the form (no selection)
          const allSelects = form.querySelectorAll('select');
          allSelects.forEach(sel => {
            try {
              sel.selectedIndex = -1; // no selection
            } catch (_) {
              sel.value = '';
            }
          });

          console.log('Form reset - all selections cleared without reload');
        }, 10);
      });
    }
  }

  // 🚀 Initial Setup
  if (simpleMode) setMode('simple');
  if (purposeSelect) purposeSelect.dispatchEvent(new Event('change'));
  if (locationSelect) locationSelect.dispatchEvent(new Event('change'));
  if (sourceSelect) sourceSelect.dispatchEvent(new Event('change'));
  if (deliverySelect) deliverySelect.dispatchEvent(new Event('change'));
  console.log('Initial setup complete'); // Debug
  
  // Add event listeners for pump stages toggle
  if (purposeSelect) purposeSelect.addEventListener('change', togglePumpStages);
  if (locationSelect) locationSelect.addEventListener('change', togglePumpStages);
});

// 🖨️ Global Print Function for PDF Generation
window.printPumpRecommendation = function(elementId, modelName, dateTime, buttonElement) {
  // Check if html2pdf is available
  if (typeof html2pdf === 'undefined') {
    alert('PDF library not loaded. Please refresh the page and try again.');
    console.error('html2pdf library not found');
    return;
  }
  
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Recommendation not found');
    return;
  }
  
  // Get button and progress elements
  const button = buttonElement || document.querySelector(`#print-btn-${elementId}`);
  const progressContainer = document.getElementById(`progress-container-${elementId}`);
  const progressBar = document.getElementById(`progress-bar-${elementId}`);
  const progressText = document.getElementById(`progress-text-${elementId}`);
  
  // Store original button text
  const originalText = button ? button.innerHTML : '🖨️ Print File';
  
  // Update button and show progress
  if (button) {
    button.disabled = true;
    button.innerHTML = '⏳ Generating PDF...';
  }
  
  if (progressContainer) {
    progressContainer.style.display = 'block';
  }
  
  // Update progress function
  function updateProgress(percent, text) {
    if (progressBar) {
      progressBar.style.width = percent + '%';
    }
    if (progressText) {
      progressText.textContent = text;
    }
  }
  
  // Start progress
  updateProgress(10, 'Preparing content...');
  
  // Remove images completely from DOM to avoid CORS/tainted canvas issues
  const images = element.querySelectorAll('img');
  const imagePlaceholders = [];
  images.forEach(img => {
    // Create a placeholder div to maintain layout
    const placeholder = document.createElement('div');
    placeholder.style.display = 'none'; // Hidden placeholder
    placeholder.className = 'image-placeholder';
    placeholder.setAttribute('data-image-src', img.src);
    
    // Store image info for restoration
    imagePlaceholders.push({
      img: img,
      parent: img.parentNode,
      nextSibling: img.nextSibling,
      placeholder: placeholder
    });
    
    // Replace image with placeholder
    img.parentNode.replaceChild(placeholder, img);
  });
  
  updateProgress(30, 'Processing content...');
  
  // Small delay to ensure content is ready
  setTimeout(() => {
    updateProgress(50, 'Generating PDF...');
    
    // Scroll element into view to ensure it's fully rendered
    element.scrollIntoView({ behavior: 'auto', block: 'start' });
    
    // Wait a bit more to ensure rendering
    setTimeout(() => {
      updateProgress(70, 'Creating PDF file...');
      
      // Get actual dimensions
      const rect = element.getBoundingClientRect();
      const actualWidth = Math.max(element.scrollWidth, rect.width, 1200);
      const actualHeight = Math.max(element.scrollHeight, rect.height);
      
      // Create print options optimized for PDF (without images, text only)
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `Pump_Recommendation_${modelName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: false,
          logging: false,
          letterRendering: true,
          allowTaint: false, // Prevent tainted canvas - critical!
          backgroundColor: '#ffffff',
          width: actualWidth,
          height: actualHeight,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: -window.scrollY,
          windowWidth: actualWidth,
          windowHeight: actualHeight,
          ignoreElements: (element) => {
            // Ignore any remaining images or placeholders
            return element.tagName === 'IMG' || element.classList.contains('image-placeholder');
          },
          onclone: (clonedDoc) => {
            // Remove all images from cloned document completely
            const clonedImages = clonedDoc.querySelectorAll('img');
            clonedImages.forEach(clonedImg => {
              clonedImg.remove(); // Remove completely, don't just hide
            });
            
            // Remove image placeholders
            const placeholders = clonedDoc.querySelectorAll('.image-placeholder');
            placeholders.forEach(placeholder => {
              placeholder.remove();
            });
            
            // Hide print button and progress bar in PDF
            const printBtn = clonedDoc.querySelector('.print-button-container');
            if (printBtn) {
              printBtn.style.display = 'none';
            }
            
            // Ensure all text content is visible and properly styled with high contrast
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(el => {
              // Skip script and style tags
              if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
                return;
              }
              
              // Ensure display is not none (except print button)
              if (el.classList && el.classList.contains('print-button-container')) {
                el.style.display = 'none';
                return;
              }
              
              const style = window.getComputedStyle(el);
              
              // Fix display
              if (style.display === 'none') {
                el.style.display = '';
              }
              
              // Fix visibility
              if (style.visibility === 'hidden') {
                el.style.visibility = 'visible';
              }
              
              // Fix opacity
              if (style.opacity === '0') {
                el.style.opacity = '1';
              }
              
              // Ensure text has good contrast for PDF
              if (el.textContent && el.textContent.trim().length > 0) {
                const textColor = style.color;
                // If text is white or very light, make it dark for PDF
                if (textColor.includes('rgb(255') || textColor.includes('rgba(255') || 
                    textColor === 'white' || textColor === '#ffffff' || 
                    textColor.includes('255, 255, 255')) {
                  // Keep white text on dark backgrounds, but ensure it's visible
                  const bgColor = style.backgroundColor;
                  if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
                    el.style.color = '#000000';
                  }
                }
              }
            });
            
            // Ensure all content sections are visible
            const contentSections = clonedDoc.querySelectorAll('.pump-recommendation > *');
            contentSections.forEach(section => {
              if (section.style.display === 'none' && !section.classList.contains('print-button-container')) {
                section.style.display = '';
              }
            });
            
            console.log('Document cloned, text elements:', clonedDoc.querySelectorAll('h1, h2, h3, h4, p, div').length);
          }
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      // Generate and download PDF
      html2pdf().set(opt).from(element).save().then(() => {
        updateProgress(100, 'PDF generated successfully!');
        
        // Restore images to original positions
        imagePlaceholders.forEach(({ img, parent, placeholder }) => {
          if (placeholder && placeholder.parentNode) {
            placeholder.parentNode.replaceChild(img, placeholder);
          } else if (parent) {
            // Fallback: insert image back into parent
            parent.appendChild(img);
          }
        });
        
        // Restore button after a short delay
        setTimeout(() => {
          if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
          }
          if (progressContainer) {
            progressContainer.style.display = 'none';
          }
          if (progressBar) {
            progressBar.style.width = '0%';
          }
        }, 1000);
        
      }).catch((error) => {
        console.error('PDF generation error:', error);
        
        // Restore images even on error
        imagePlaceholders.forEach(({ img, parent, placeholder }) => {
          if (placeholder && placeholder.parentNode) {
            placeholder.parentNode.replaceChild(img, placeholder);
          } else if (parent) {
            parent.appendChild(img);
          }
        });
        
        // Update progress to show error
        updateProgress(0, 'Error generating PDF');
        
        // Restore button
        setTimeout(() => {
          if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
          }
          if (progressContainer) {
            progressContainer.style.display = 'none';
          }
          if (progressBar) {
            progressBar.style.width = '0%';
          }
          alert('Error generating PDF: ' + (error.message || 'Unknown error. Please try again.'));
        }, 1500);
      });
    }, 500); // Wait 500ms for content to render
  }, 300);
};