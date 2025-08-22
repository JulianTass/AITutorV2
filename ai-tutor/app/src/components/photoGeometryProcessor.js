// src/components/photoGeometryProcessor.js

// Basic OCR-like text detection for angles and measurements
export const extractTextFromImage = async (imageDataUrl) => {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data: { text } } = await worker.recognize(imageDataUrl);
    await worker.terminate();
    
    console.log('OCR extracted text:', text);
    return text;
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to read text from image');
  }
};
// Enhanced problem type detection
export const classifyGeometryProblem = (extractedText) => {
  const text = extractedText.toLowerCase();
  
  // Triangle inequality problems
  if (text.includes('range of possible lengths') || 
      text.includes('triangle inequality') ||
      (text.includes('determine') && text.includes('lengths')) ||
      text.includes('unknown sides')) {
    return {
      type: 'triangle_inequality',
      confidence: 0.9,
      description: 'Triangle inequality - finding possible side lengths'
    };
  }
  
  // Missing angles in triangles
  if ((text.includes('missing angles') || (text.includes('work out') && text.includes('angles'))) &&
      text.includes('triangle')) {
    return {
      type: 'triangle_missing_angles',
      confidence: 0.9,
      description: 'Finding missing angles in triangles'
    };
  }
  
  // General triangle angle problems
  if (text.includes('triangle') && (text.includes('angle') || text.includes('°'))) {
    return {
      type: 'triangle_angles',
      confidence: 0.7,
      description: 'Triangle angle calculation'
    };
  }
  
  // Parallel lines
  if (text.includes('parallel') || text.includes('transversal')) {
    return {
      type: 'parallel_lines',
      confidence: 0.8,
      description: 'Parallel lines and angles'
    };
  }
  
  // Area and volume
  if (text.includes('area') || text.includes('volume') || text.includes('perimeter')) {
    return {
      type: 'area_volume',
      confidence: 0.8,
      description: 'Area and volume calculations'
    };
  }
  
  return {
    type: 'unknown',
    confidence: 0.3,
    description: 'Unknown geometry problem type'
  };
};

// Extract numerical values and labels
export const extractGeometryData = (text, problemType) => {
  const data = {
    angles: [],
    sides: [],
    variables: [],
    relationships: []
  };
  
  // Extract angle measurements
  const angleMatches = text.match(/(\d+)\s*°/g);
  if (angleMatches) {
    data.angles = angleMatches.map(match => parseInt(match.replace('°', '')));
  }
  
  // Extract decimal numbers (likely side lengths)
  const sideMatches = text.match(/\b\d+\.\d+\b/g);
  if (sideMatches) {
    data.sides = sideMatches.map(match => parseFloat(match));
  }
  
  // Extract whole numbers that aren't angles
  const numberMatches = text.match(/\b\d+\b/g);
  if (numberMatches) {
    const numbers = numberMatches
      .map(match => parseInt(match))
      .filter(num => !data.angles.includes(num) && num < 100);
    data.sides.push(...numbers);
  }
  
  // Extract variables (x, y, a, b, etc.)
  const variableMatches = text.match(/\b[a-z]\b/gi);
  if (variableMatches) {
    data.variables = [...new Set(variableMatches.map(v => v.toLowerCase()))];
  }
  
  return data;
};

// Convert to geometry visualization format
export const convertToGeometryVisualization = (problemType, geometryData, text) => {
  switch (problemType) {
    case 'triangle_inequality':
      return {
        shape: 'triangle_inequality',
        dimensions: {
          knownSides: geometryData.sides.slice(0, 2),
          unknownVariable: geometryData.variables[0] || 'x',
          problemText: text
        }
      };
      
    case 'triangle_missing_angles':
    case 'triangle_angles':
      return {
        shape: 'triangle_find_angle',
        dimensions: {
          angle1: geometryData.angles[0] || null,
          angle2: geometryData.angles[1] || null,
          angle3: geometryData.angles[2] || null,
          variables: geometryData.variables
        }
      };
      
    case 'parallel_lines':
      return {
        shape: 'parallel_lines',
        dimensions: {
          showAngles: true,
          angles: geometryData.angles,
          variables: geometryData.variables
        }
      };
      
    default:
      return null;
  }
};

// Main enhanced processing function
export const processGeometryPhotoEnhanced = async (imageFile, imageDataUrl) => {
  try {
    console.log('Starting enhanced photo processing...');
    
    // Step 1: Extract text using OCR (mock for now)
    const extractedText = await extractTextFromImage(imageDataUrl);
    
    // Step 2: Classify the problem type
    const classification = classifyGeometryProblem(extractedText);
    
    // Step 3: Extract geometry data
    const geometryData = extractGeometryData(extractedText, classification.type);
    
    // Step 4: Convert to visualization format
    const geometryResult = convertToGeometryVisualization(
      classification.type, 
      geometryData, 
      extractedText
    );
    
    return {
      success: true,
      extractedText,
      classification,
      geometryData,
      geometryResult,
      confidence: classification.confidence
    };
    
  } catch (error) {
    console.error('Enhanced photo processing error:', error);
    return {
      success: false,
      error: error.message,
      extractedText: '',
      classification: { type: 'unknown', confidence: 0 },
      geometryResult: null
    };
  }
};

// Main processing function (legacy version for compatibility)
export const processGeometryPhoto = async (imageFile, imageDataUrl) => {
  try {
    // Use the enhanced processor for better results
    return await processGeometryPhotoEnhanced(imageFile, imageDataUrl);
  } catch (error) {
    console.error('Error processing geometry photo:', error);
    return {
      success: false,
      error: error.message,
      extractedText: '',
      analysis: null,
      geometryResult: null
    };
  }
};

// Integration with Tesseract.js (if you want to add real OCR)
export const setupTesseractOCR = async () => {
  try {
    // Uncomment and install tesseract.js: npm install tesseract.js
    // const { createWorker } = await import('tesseract.js');
    // const worker = createWorker();
    // await worker.load();
    // await worker.loadLanguage('eng');
    // await worker.initialize('eng');
    // return worker;
  } catch (error) {
    console.error('Failed to setup Tesseract:', error);
  }
  return null;
};

// Real OCR with Tesseract (optional enhancement)
export const extractTextWithTesseract = async (imageDataUrl, worker) => {
  if (!worker) {
    return extractTextFromImage(imageDataUrl); // Fallback to mock
  }
  
  try {
    const { data: { text } } = await worker.recognize(imageDataUrl);
    return text;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    return extractTextFromImage(imageDataUrl); // Fallback
  }
};