import React, { useState, useRef } from "react";
import { useMutation } from "@apollo/client";
import { ADD_USER } from "../../../../utils/graphql/users/mutations.js";
import ModalForm from "../../../../components/Modal/ModalForm";

/**
 * Component to import users from a CSV file
 * Expected CSV format:
 * username,email,admin,phone,about
 * John Doe,john@example.com,false,555-1234,Bio text
 */
export default function ImportUsersCSV({ onClose, onSuccess }) {
  const [addUser] = useMutation(ADD_USER);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required columns
    if (!header.includes('username') || !header.includes('email')) {
      throw new Error("CSV must have 'username' and 'email' columns");
    }

    // Parse data rows
    const users = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue; // Skip empty lines

      const user = {};
      header.forEach((key, index) => {
        if (values[index] !== undefined) {
          user[key] = values[index].trim();
        }
      });

      // Validate required fields
      if (user.username && user.email) {
        users.push({
          username: user.username,
          email: user.email,
          admin: user.admin === 'true' || user.admin === '1',
          phone: user.phone || '',
          about: user.about || '',
          attributes: []
        });
      }
    }

    return users;
  };

  // Helper function to parse CSV line handling quoted values
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setStatus("Please select a CSV file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setStatus("");
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setStatus("Please select a file");
      return;
    }

    setImporting(true);
    setStatus("Reading file...");
    setResults(null);

    try {
      // Read file content
      const text = await file.text();
      
      // Parse CSV
      setStatus("Parsing CSV...");
      const users = parseCSV(text);

      if (users.length === 0) {
        setStatus("No valid users found in CSV");
        setImporting(false);
        return;
      }

      setStatus(`Importing ${users.length} user(s)...`);

      // Import users
      let success = 0;
      let failed = 0;
      const failures = [];

      for (const user of users) {
        try {
          await addUser({
            variables: {
              username: user.username,
              email: user.email,
              admin: user.admin,
              phone: user.phone,
              about: user.about,
              attributes: user.attributes,
            }
          });
          success++;
        } catch (err) {
          console.error("Failed to import user", user.email, err);
          failed++;
          failures.push(`${user.username} (${user.email}): ${err.message}`);
        }
      }

      const resultSummary = {
        total: users.length,
        success,
        failed,
        failures
      };

      setResults(resultSummary);
      setStatus(`Import complete: ${success} succeeded, ${failed} failed`);

      if (success > 0) {
        onSuccess?.();
      }

    } catch (err) {
      console.error("Import error:", err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = "username,email,admin,phone,about\nJohn Doe,john@example.com,false,555-1234,Software Engineer\nJane Smith,jane@example.com,true,555-5678,Project Manager";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModalForm
      title="Import Users from CSV"
      onClose={onClose}
      footer={
        <>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={importing}
          >
            Close
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? "Importing..." : "Import"}
          </button>
        </>
      }
    >
      <div className="mb-3">
        <p className="text-muted mb-2">
          Upload a CSV file with user information. Required columns: <code>username</code>, <code>email</code>
        </p>
        <p className="text-muted mb-2">
          Optional columns: <code>admin</code> (true/false), <code>phone</code>, <code>about</code>
        </p>
        <button 
          className="btn btn-sm btn-outline-info mb-3"
          onClick={handleDownloadTemplate}
        >
          📥 Download Template CSV
        </button>
      </div>

      <div className="mb-3">
        <label className="form-label">Select CSV File</label>
        <input
          ref={fileInputRef}
          type="file"
          className="form-control"
          accept=".csv"
          onChange={handleFileChange}
          disabled={importing}
        />
        {file && (
          <div className="mt-2 text-muted small">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </div>
        )}
      </div>

      {status && (
        <div className={`alert ${results ? (results.failed > 0 ? 'alert-warning' : 'alert-success') : 'alert-info'}`}>
          {status}
        </div>
      )}

      {results && results.failures.length > 0 && (
        <div className="mt-3">
          <h6>Failed Imports:</h6>
          <div className="alert alert-danger" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <ul className="mb-0 small">
              {results.failures.map((failure, idx) => (
                <li key={idx}>{failure}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </ModalForm>
  );
}
