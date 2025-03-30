// --- Added React import and styles import ---
import React, { useState, useEffect } from 'react';
import styles from './FilterPanel.module.css';
// --- End Added Imports ---

// Basic Debounce Hook (can be moved to src/hooks/useDebounce.js later)
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

// --- Ensure props 'onChange' and 'disabled' are destructured ---
function FilterPanel({ options, criteria, onChange, disabled }) {
  // --- Ensure setKeywordInput is defined via useState ---
  const [keywordInput, setKeywordInput] = useState(criteria.keyword || '');
  const debouncedKeyword = useDebounce(keywordInput, 300);

  useEffect(() => {
    if (debouncedKeyword !== criteria.keyword ) {
         onChange({ keyword: debouncedKeyword }); // 'onChange' is used here
    }
  // --- Add criteria.keyword to dependency array if comparing against it ---
  }, [debouncedKeyword, onChange, criteria.keyword]);

   useEffect(() => {
    if (criteria.keyword !== keywordInput) {
        setKeywordInput(criteria.keyword || ''); // 'setKeywordInput' is used here
    }
  }, [criteria.keyword]);


  // --- Ensure handleDropdownChange is defined ---
  const handleDropdownChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value }); // 'onChange' is used here
  };

  const handleKeywordChange = (e) => {
    setKeywordInput(e.target.value); // 'setKeywordInput' is used here
  };

  // --- Ensure handleReset is defined and uses onChange / setKeywordInput ---
  const handleReset = () => {
    setKeywordInput(''); // Uses setKeywordInput
    onChange({ // Uses onChange
        standard: '', learningObjective: '', keyword: '', topic: '',
    });
  };

  const safeOptions = {
      standards: options?.standards || [],
      objectives: options?.objectives || [],
      topics: options?.topics || [],
  };


  return (
    // --- Ensure 'styles' is used for classNames ---
    <div className={styles.filterPanel}>
      <div className={styles.filterGroup}>
        <label htmlFor="keyword">Keyword Search</label>
        <input
          type="text" id="keyword" name="keyword" placeholder="Search text, keywords..."
          value={keywordInput} onChange={handleKeywordChange} disabled={disabled}
          className={styles.inputField} // Use styles
        />
      </div>

      {safeOptions.standards.length > 0 && (
          <div className={styles.filterGroup}>
            <label htmlFor="standard">Standard</label>
            <select
              id="standard" name="standard" value={criteria.standard || ''}
              onChange={handleDropdownChange} // Use defined handler
              disabled={disabled} className={styles.selectField} // Use styles
            >
              <option value="">All Standards</option>
              {safeOptions.standards.map((std) => (<option key={std} value={std}>{std}</option>))}
            </select>
          </div>
      )}

       {safeOptions.objectives.length > 0 && (
            <div className={styles.filterGroup}>
                <label htmlFor="learningObjective">Learning Objective</label>
                <select
                    id="learningObjective" name="learningObjective" value={criteria.learningObjective || ''}
                    onChange={handleDropdownChange} // Use defined handler
                    disabled={disabled} className={styles.selectField} // Use styles
                    >
                    <option value="">All Objectives</option>
                    {safeOptions.objectives.map((obj) => (<option key={obj} value={obj}>{obj}</option>))}
                </select>
            </div>
       )}

      {safeOptions.topics.length > 0 && (
            <div className={styles.filterGroup}>
                <label htmlFor="topic">Topic</label>
                <select
                    id="topic" name="topic" value={criteria.topic || ''}
                    onChange={handleDropdownChange} // Use defined handler
                    disabled={disabled} className={styles.selectField} // Use styles
                    >
                    <option value="">All Topics</option>
                    {safeOptions.topics.map((topic) => (<option key={topic} value={topic}>{topic}</option>))}
                </select>
            </div>
       )}

       <button onClick={handleReset} disabled={disabled} className={styles.resetButton} /* Use styles */ >
            Reset Filters
        </button>

    </div>
  );
}

export default FilterPanel;