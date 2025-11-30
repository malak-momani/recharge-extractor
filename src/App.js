import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [extractedData, setExtractedData] = useState([]);

  const extractData = () => {
    if (!text.trim()) {
      alert('Please enter your recharge data text first');
      return;
    }

    // Split by the record separator (multiple * characters)
    const records = text.split(/\*{4,}/).filter(record => record.trim().length > 0);

    const extracted = [];

    records.forEach((record, recordIndex) => {
      // Auto-detect category from the record
      let category = 'Unknown';
      if (record.includes('Orange') || record.includes('ORANGE')) {
        category = 'Orange';
      } else if (record.includes('Zain') || record.includes('ZAIN')) {
        category = 'Zain';
      } else if (record.includes('Umniah') || record.includes('UMNIAH')) {
        category = 'Umniah';
      }

      const data = {
        id: recordIndex + 1,
        Category: category,
        Brand: '',
        Denomination: '',
        'Recharge PIN': '',
        'Serial Number': ''
      };

      // Extract Brand
      const brandMatch = record.match(/Brand :\s*([^\n\r]+)/);
      if (brandMatch) data.Brand = brandMatch[1].trim();

      // Extract Denomination
      const denominationMatch = record.match(/Denomination :\s*([^\n\r]+)/);
      if (denominationMatch) data.Denomination = denominationMatch[1].trim();

      // Extract Recharge PIN (look for 14-digit numbers)
      const pinMatches = record.match(/\b\d{14}\b/g);
      if (pinMatches && pinMatches.length > 0) {
        // Find the PIN that comes after "Recharge PIN" or is standalone
        const rechargePinSection = record.toLowerCase().includes('recharge pin') ?
          record.substring(record.toLowerCase().indexOf('recharge pin')) : record;
        const pinAfterLabel = rechargePinSection.match(/\b\d{14}\b/);
        data['Recharge PIN'] = pinAfterLabel ? pinAfterLabel[0] : pinMatches[0];
      }

      // Extract Serial Number
      const serialMatch = record.match(/Serial Number :\s*([^\n\r]+)/);
      if (serialMatch) data['Serial Number'] = serialMatch[1].trim();

      // Only add if we found substantial data
      if (data['Recharge PIN'] || data.Brand || data.Denomination) {
        extracted.push(data);
      }
    });

    setExtractedData(extracted);

    if (extracted.length === 0) {
      alert('No recharge data found. Please check your text format.');
    } else {
      alert(`Successfully extracted ${extracted.length} recharge records!`);
    }
  };

  const exportToExcel = () => {
    if (extractedData.length === 0) {
      alert('No data to export. Please extract data first.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(extractedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recharge Data');

    // Auto-size columns
    worksheet['!cols'] = [
      { wch: 5 },   // ID
      { wch: 10 },  // Category
      { wch: 15 },  // Brand
      { wch: 15 },  // Denomination
      { wch: 20 },  // Recharge PIN
      { wch: 25 }   // Serial Number
    ];

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(data, `recharge_data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const clearAll = () => {
    setText('');
    setExtractedData([]);
  };

  const copyExample = () => {
    const exampleText = `Category : Orange
Date : 2025-11-29T12:27:59.953
PosId : 16002
Brand : Orange Data
Denomination : JOD 10

***

Recharge PIN

11584463856769
***
ExpiryDate : 2030-06-24T00:00:00
Serial Number : 96277-433361301`;

    setText(exampleText);
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Smart Recharge Data Extractor</h1>
        <p>Automatically extracts Category, Brand, Denomination, Recharge PIN, and Serial Number</p>

        <div className="controls">
          <div className="button-group">
            <button onClick={extractData} className="btn btn-primary">
              Extract Data
            </button>
            <button onClick={exportToExcel} className="btn btn-success">
              Export to Excel
            </button>
            <button onClick={clearAll} className="btn btn-secondary">
              Clear All
            </button>
            <button onClick={copyExample} className="btn btn-info">
              Load Example
            </button>
          </div>
        </div>

        <div className="text-area-section">
          <label htmlFor="text-input">Paste your recharge data here:</label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste your recharge data here... Example format:

Category : Orange
Date : 2025-11-29T12:27:59.953
PosId : 16002
Brand : Orange Data
Denomination : JOD 10

***

Recharge PIN

11584463856769
***
ExpiryDate : 2030-06-24T00:00:00
Serial Number : 96277-433361301`}
            className="text-area"
            rows="20"
          />
        </div>

        {extractedData.length > 0 && (
          <div className="results-section">
            <h3>Extracted Data ({extractedData.length} records found):</h3>

            {/* Category Summary */}
            <div className="category-summary">
              <h4>Category Summary:</h4>
              <div className="category-tags">
                {Object.entries(
                  extractedData.reduce((acc, item) => {
                    acc[item.Category] = (acc[item.Category] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([category, count]) => (
                  <span key={category} className="category-tag">
                    {category}: {count}
                  </span>
                ))}
              </div>
            </div>

            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Denomination</th>
                    <th>Recharge PIN</th>
                    <th>Serial Number</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        <span className={`category-badge category-${item.Category.toLowerCase()}`}>
                          {item.Category}
                        </span>
                      </td>
                      <td>{item.Brand}</td>
                      <td>{item.Denomination}</td>
                      <td className="pin-cell">{item['Recharge PIN']}</td>
                      <td>{item['Serial Number']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;