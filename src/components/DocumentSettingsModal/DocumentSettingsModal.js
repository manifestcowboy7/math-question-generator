import React, { useState } from 'react';
import styles from './DocumentSettingsModal.module.css';

function DocumentSettingsModal({ onClose, onGenerate, isGenerating }) {
  const [format, setFormat] = useState('pdf'); // Default format
  const [title, setTitle] = useState('Math Practice');
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  // Add more state for template, header/footer options later

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    if (isGenerating) return; // Prevent multiple submissions

    // Pass settings up to parent component
    onGenerate({
      format,
      title: title.trim() || 'Untitled Document', // Ensure title isn't empty
      includeAnswerKey,
      // Add other settings here
    });
  };

  return (
    // Modal overlay
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Document Settings</h2>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className={styles.formGroup}>
            <label htmlFor="docTitle">Document Title:</label>
            <input
              type="text"
              id="docTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              className={styles.inputField}
              disabled={isGenerating}
            />
          </div>

          {/* Format Selection */}
          <div className={styles.formGroup}>
            <label>Format:</label>
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value)}
                  disabled={isGenerating}
                /> PDF
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="docx"
                  checked={format === 'docx'}
                  onChange={(e) => setFormat(e.target.value)}
                  disabled={isGenerating}
                /> Word (.docx)
              </label>
              <label>
                <input
                  type="radio"
                  name="format"
                  value="txt"
                  checked={format === 'txt'}
                  onChange={(e) => setFormat(e.target.value)}
                  disabled={isGenerating}
                /> Text (.txt)
              </label>
            </div>
          </div>

          {/* Answer Key Option */}
          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                disabled={isGenerating}
              /> Include Answer Key (if available)
            </label>
          </div>

          {/* Add Template/Layout options here later */}

          {/* Action Buttons */}
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.cancelButton}`}
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.generateButton}`}
              disabled={isGenerating} // Disable while generating
            >
              {isGenerating ? 'Generating...' : 'Generate Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DocumentSettingsModal;