// src/App.js
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Import useMemo
import './App.css';
import { supabase } from './supabaseClient';
import { BsTag, BsBookmark, BsLightning } from 'react-icons/bs';
import parseMathText from './utils/mathParser';

function App() {
  // State
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  // Filter State
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDOK, setSelectedDOK] = useState(null);
  const [selectedStandard, setSelectedStandard] = useState(null);
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]); // For right panel

  // --- Fetch Available Topics ---
  useEffect(() => {
    const fetchTopics = async () => {
       setError(null);
       try {
         const { data, error } = await supabase.from('questions').select('topic');
         if (error) throw error;
         if (data) {
           const uniqueTopics = [...new Set(data.map(item => item.topic).filter(topic => topic))];
           setAvailableTopics(uniqueTopics.sort());
         }
       } catch (error) {
         console.error('Error fetching topics:', error);
         setError('Could not fetch topics. Please try refreshing.');
         setAvailableTopics([]);
       }
    };
    fetchTopics();
  }, []); // Empty dependency array means run once on mount

  // --- Fetch Questions ---
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const selectColumns = 'id, question_text, topic, standard, learning_objective, dok';
      let query = supabase.from('questions').select(selectColumns);

      if (selectedTopics.length > 0) {
        query = query.in('topic', selectedTopics);
      }
      if (selectedDOK !== null) {
        query = query.eq('dok', selectedDOK);
      }
      if (selectedStandard !== null) {
        query = query.eq('standard', selectedStandard);
      }
      query = query.order('topic');

      const { data, error } = await query;
      if (error) throw error;
      setAllQuestions(data || []);

    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Could not fetch questions. Please check your connection or filters.');
      setAllQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTopics, selectedDOK, selectedStandard]);

  // --- Trigger Fetch Questions ---
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // --- Apply Client-Side Filtering (Keyword Search) ---
  useEffect(() => {
    let tempFiltered = allQuestions;
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      tempFiltered = tempFiltered.filter(q =>
         (q.question_text && q.question_text.toLowerCase().includes(lowerCaseSearchTerm)) ||
         (q.topic && q.topic.toLowerCase().includes(lowerCaseSearchTerm)) ||
         (q.standard && q.standard.toLowerCase().includes(lowerCaseSearchTerm)) ||
         (q.learning_objective && q.learning_objective.toLowerCase().includes(lowerCaseSearchTerm)) ||
         (q.dok && String(q.dok).toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    setFilteredQuestions(tempFiltered);
  }, [searchTerm, allQuestions]);

  // --- Event Handlers --- (Corrected Definitions)

  const handleTopicChange = (event) => {
    const { value, checked } = event.target;
    setSelectedDOK(null);
    setSelectedStandard(null);
    setSelectedTopics(prevSelected =>
      checked ? [...prevSelected, value] : prevSelected.filter(topic => topic !== value)
    );
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleQuestionSelectionChange = (questionId, isChecked) => {
    setSelectedQuestionIds(prevIds =>
      isChecked ? [...prevIds, questionId] : prevIds.filter(id => id !== questionId)
    );
  };

  const handleTopicPillClick = (topicValue) => {
    setSearchTerm('');
    setSelectedDOK(null);
    setSelectedStandard(null);
    setSelectedTopics([topicValue]);
  };

  const handleDOKPillClick = (dokValue) => {
    setSearchTerm('');
    setSelectedTopics([]);
    setSelectedStandard(null);
    setSelectedDOK(dokValue);
  };

  const handleStandardPillClick = (standardValue) => {
    setSearchTerm('');
    setSelectedTopics([]);
    setSelectedDOK(null);
    setSelectedStandard(standardValue);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTopics([]);
    setSelectedDOK(null);
    setSelectedStandard(null);
  };
  // --- End Event Handlers ---


  // --- Helper for selected question details ---
  const selectedQuestionsDetails = useMemo(() => {
    return allQuestions.filter(q => selectedQuestionIds.includes(q.id));
  }, [selectedQuestionIds, allQuestions]);

  // --- Calculate DOK Analysis ---
  const dokAnalysis = useMemo(() => {
    const totalSelected = selectedQuestionsDetails.length;
    if (totalSelected === 0) {
      return { total: 0, breakdown: [] };
    }

    const dokCounts = {};
    selectedQuestionsDetails.forEach(question => {
      const dokLevel = question.dok ?? 'N/A';
      dokCounts[dokLevel] = (dokCounts[dokLevel] || 0) + 1;
    });

    const breakdown = Object.entries(dokCounts)
      .map(([dok, count]) => ({
        dok: dok,
        count: count,
        percentage: ((count / totalSelected) * 100).toFixed(1)
      }))
      .sort((a, b) => {
        if (a.dok === 'N/A') return 1;
        if (b.dok === 'N/A') return -1;
        return parseFloat(a.dok) - parseFloat(b.dok);
      });

    return { total: totalSelected, breakdown: breakdown };
  }, [selectedQuestionsDetails]);


  // --- Render ---
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Math Question Generator</h1>
      </header>

      <main className="main-content">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
           <h2>Filters</h2>
           {/* Keyword Search */}
           <div className="filter-group">
              <input type="search" placeholder="Search text, keywords..." value={searchTerm} onChange={handleSearchChange} />
              <button onClick={handleResetFilters}>Reset Filters</button>
           </div>
           {/* Topic Checklist */}
           <div className="filter-group">
             <h3>Topic</h3>
              {availableTopics.length > 0 ? (
                <div className="topic-checklist">
                  {availableTopics.map(topic => (
                    <label key={topic}>
                      <input type="checkbox" value={topic} checked={selectedTopics.includes(topic)} onChange={handleTopicChange} />
                      {topic}
                    </label>
                  ))}
                </div>
              ) : (
                 <p>{loading ? 'Loading topics...' : 'No topics available.'}</p>
              )}
           </div>

           {/* Selection Analysis Section */}
           <div className="selection-analysis filter-group">
                <h3>Selection Analysis</h3>
                {dokAnalysis.total === 0 ? (
                    <p className="analysis-placeholder">Select questions to see DOK breakdown.</p>
                ) : (
                    <ul className="dok-breakdown-list">
                        {dokAnalysis.breakdown.map(item => (
                            <li key={item.dok} className="dok-breakdown-item">
                                <span>DOK {item.dok}:</span>
                                <span>{item.count} ({item.percentage}%)</span>
                            </li>
                        ))}
                         <li className="dok-breakdown-total">
                            <strong>Total Selected: {dokAnalysis.total}</strong>
                         </li>
                    </ul>
                )}
           </div>
        </aside>

        {/* Available Questions List */}
        <section className="questions-list-container">
          <h2>Available Questions ({filteredQuestions.length})</h2>
          {loading && <p className="loading-message">Loading questions...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && (
            <>
              {filteredQuestions.length === 0 && <p>No questions match the current filters.</p>}
              {filteredQuestions.map(question => {
                const truncatedLO = question.learning_objective
                  ? question.learning_objective.substring(0, 80) + (question.learning_objective.length > 80 ? '...' : '')
                  : '';
                const formattedQuestionText = parseMathText(question.question_text);

                return (
                  <div key={question.id} className="question-item">
                    {/* Checkbox */}
                    <input
                        type="checkbox"
                        checked={selectedQuestionIds.includes(question.id)}
                        onChange={(e) => handleQuestionSelectionChange(question.id, e.target.checked)}
                        aria-label={`Select question: ${question.question_text}`}
                    />
                    {/* Details */}
                    <div className="question-details">
                      <p>{formattedQuestionText}</p>
                      {/* Metadata Pills/Buttons */}
                      <div className="question-meta combination">
                        <div className="meta-pills">
                          {question.dok !== null && question.dok !== undefined && (
                             <button className="pill-button dok-pill" onClick={() => handleDOKPillClick(question.dok)} title={`Filter by DOK: ${question.dok}`} >
                                <BsLightning className="pill-icon" aria-hidden="true" /> DOK: {question.dok}
                             </button>
                          )}
                          {question.standard && (
                            <button className="pill-button standard-pill" onClick={() => handleStandardPillClick(question.standard)} title={`Filter by Standard: ${question.standard}`} >
                              <BsBookmark className="pill-icon" aria-hidden="true" /> Std: {question.standard}
                            </button>
                          )}
                          {question.topic && (
                            <button className="pill-button topic-pill" onClick={() => handleTopicPillClick(question.topic)} title={`Filter by topic: ${question.topic}`} >
                              <BsTag className="pill-icon" aria-hidden="true" /> Topic: {question.topic}
                            </button>
                          )}
                        </div>
                        {/* Learning Objective Text */}
                        {question.learning_objective && <p className="meta-lo">{truncatedLO}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </section>

        {/* Selected Questions Panel */}
        <aside className="selected-panel">
           <h2>Selected ({selectedQuestionIds.length})</h2>
           {selectedQuestionIds.length === 0 ? (
             <p className="placeholder-text">Drag questions here or select using checkboxes.</p>
           ) : (
             <ul className="selected-items-list">
               {selectedQuestionsDetails.map(question => (
                 <li key={question.id} className="selected-item">
                   <div className="selected-item-details">
                     <p className="selected-item-text">{parseMathText(question.question_text)}</p> {/* Parse math here too */}
                     <div className="selected-item-meta">
                       DOK: {question.dok ?? 'N/A'}
                       {question.topic && <span>Topic: {question.topic}</span>}
                     </div>
                   </div>
                   <button onClick={() => handleQuestionSelectionChange(question.id, false)} className="remove-selected-btn" aria-label={`Remove selected question: ${question.question_text}`} title="Remove" >
                     ×
                   </button>
                 </li>
               ))}
             </ul>
           )}
         </aside>
      </main>
    </div>
  );
}

export default App;