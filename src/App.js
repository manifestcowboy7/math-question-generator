// src/App.js

// --- Ensure ALL necessary hooks are imported from 'react' ---
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// --- End Import Correction ---

import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import FilterPanel from './components/FilterPanel/FilterPanel';
import QuestionList from './components/QuestionList/QuestionList';
import SelectedQuestions from './components/SelectedQuestions/SelectedQuestions';
import DocumentSettingsModal from './components/DocumentSettingsModal/DocumentSettingsModal';
import { fetchQuestions, fetchFilterOptions } from './services/questionService';
import { generateDocument } from './services/documentGenerator';
import styles from './App.module.css';

function App() {
  // --- STATE DEFINITIONS (Now useState is defined) ---
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({
    standard: '', learningObjective: '', keyword: '', topic: '',
  });
  const [filterOptions, setFilterOptions] = useState({
    standards: [], objectives: [], topics: [],
  });
  const [isLoading, setIsLoading] = useState(true); // useState needs to be imported
  const [error, setError] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // --- End State Definitions ---

  // --- CALLBACK FUNCTION DEFINITIONS ---
  const handleFilterChange = useCallback((newFilters) => {
      setFilterCriteria(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSelectQuestion = useCallback((questionId) => {
    setSelectedQuestionIds(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  }, []);

   const handleRemoveSelected = useCallback((questionId) => {
    setSelectedQuestionIds(prev => prev.filter(id => id !== questionId));
  }, []);

   const onDragEnd = useCallback((result) => {
     const { source, destination } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) { return; }
    if (source.index < 0 || source.index >= selectedQuestionIds.length || destination.index < 0) { console.error("Invalid index in onDragEnd:", source, destination); return; }
    const items = Array.from(selectedQuestionIds);
    const [reorderedItem] = items.splice(source.index, 1);
    const validDestinationIndex = Math.min(items.length, destination.index);
    items.splice(validDestinationIndex, 0, reorderedItem);
    setSelectedQuestionIds(items);
  }, [selectedQuestionIds]);

  const handleOpenSettings = () => {
     if (selectedQuestions.length === 0) { alert("Please select at least one question."); return; }
     setShowSettingsModal(true);
  };

  const handleGenerateDocument = async (settings) => {
     setShowSettingsModal(false);
     setIsGenerating(true);
     setError(null);
     console.log("Generating document with settings:", settings);
     try {
       await generateDocument(selectedQuestions, settings);
       alert("Document generation initiated successfully! Check your downloads.");
     } catch (err) {
       console.error("Document generation failed:", err);
       setError(`Document generation failed: ${err.message || 'Unknown error'}`);
       alert(`Document generation failed: ${err.message || 'Unknown error'}`);
     } finally {
       setIsGenerating(false);
     }
  };

  // --- DERIVED STATE (useMemo) ---
  const selectedQuestions = useMemo(() => {
     if (!allQuestions || allQuestions.length === 0) return [];
     try {
         const questionMap = new Map(allQuestions.map(q => [q.id, q]));
         return selectedQuestionIds.map(id => questionMap.get(id)).filter(Boolean);
     } catch (mapError) {
         console.error("Error creating selected questions map:", mapError);
         return [];
     }
  }, [selectedQuestionIds, allQuestions]);


  // --- SIDE EFFECTS (useEffect) ---
  useEffect(() => {
    const loadData = async () => {
      console.log("[App.js useEffect loadData] STARTING initial load...");
      setIsLoading(true);
      setError(null);
      setFilterOptions({ standards: [], objectives: [], topics: [] });
      try {
        console.log("[App.js useEffect loadData] Calling fetchQuestions...");
        const questions = await fetchQuestions();
        console.log(`[App.js useEffect loadData] fetchQuestions returned ${questions ? questions.length : 'null/undefined'} questions.`);

        setAllQuestions(questions || []);
        setFilteredQuestions(questions || []);

        if (questions && questions.length > 0) {
            console.log("[App.js useEffect loadData] Calling fetchFilterOptions...");
            const options = await fetchFilterOptions(questions);
            console.log("[App.js useEffect loadData] fetchFilterOptions returned.");
            setFilterOptions(options);
        } else {
             console.log("[App.js useEffect loadData] No questions fetched or empty array, skipping filter options.");
        }
        console.log("[App.js useEffect loadData] TRY block finished successfully.");
      } catch (err) {
        console.error("[App.js useEffect loadData] CATCH block error:", err);
        setError(err.message || "Failed to load data.");
        setAllQuestions([]);
        setFilteredQuestions([]);
      } finally {
        console.log("[App.js useEffect loadData] FINALLY block running, setting isLoading to false.");
        setIsLoading(false); // isLoading should now be set to false
      }
    };
    loadData();
  }, []); // Runs once on mount

  useEffect(() => {
     if (isLoading) return; // Prevent filtering until loaded
     let result = [...allQuestions];
     const { standard, learningObjective, keyword, topic } = filterCriteria;
     if (standard) result = result.filter(q => q.standard === standard);
     if (learningObjective) result = result.filter(q => q.learning_objective === learningObjective);
     if (topic) result = result.filter(q => q.topic === topic);
     if (keyword) {
          const lowerKeyword = keyword.toLowerCase().trim();
          if (lowerKeyword) {
              result = result.filter(q =>
                (q.question_text && q.question_text.toLowerCase().includes(lowerKeyword)) ||
                (q.tags && Array.isArray(q.tags) && q.tags.some(k => k && k.toLowerCase().includes(lowerKeyword))) ||
                (q.standard && q.standard.toLowerCase().includes(lowerKeyword)) ||
                (q.learning_objective && q.learning_objective.toLowerCase().includes(lowerKeyword)) ||
                (q.topic && q.topic.toLowerCase().includes(lowerKeyword))
              );
          }
      }
     setFilteredQuestions(result);
  }, [filterCriteria, allQuestions, isLoading]); // Rerun if criteria, data, or loading state changes


  // --- RETURN STATEMENT ---
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={styles.appContainer}>
        <header className={styles.appHeader}><h1>Math Question Generator</h1></header>
        {isGenerating && <div className={styles.loadingOverlay}>Generating Document...</div>}
        {error && !isLoading && <p className={`${styles.error} ${styles.globalError}`}>{error}</p>}
        <div className={styles.mainContent}>
          <aside className={styles.filterSidebar}>
            <h2>Filters</h2>
            <FilterPanel options={filterOptions} criteria={filterCriteria} onChange={handleFilterChange} disabled={isLoading || isGenerating} />
          </aside>
          <section className={styles.questionArea}>
            <h2>Available Questions ({filteredQuestions.length})</h2>
            {/* Show loading indicator correctly */}
            {isLoading && <p>Loading questions...</p>}
            {!isLoading && !error && allQuestions.length === 0 && <p>No questions found in the database.</p>}
            {!isLoading && !error && allQuestions.length > 0 && filteredQuestions.length === 0 && <p>No questions match the current filters.</p>}
            {!isLoading && !error && filteredQuestions.length > 0 && (
              <QuestionList key={JSON.stringify(filterCriteria)} questions={filteredQuestions} selectedIds={selectedQuestionIds} onSelect={handleSelectQuestion} />
            )}
          </section>
          <aside className={styles.selectedSidebar}>
             <Droppable droppableId="selectedQuestions">
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className={`${styles.selectedListContainer} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}>
                  <h2>Selected ({selectedQuestions.length})</h2>
                  {selectedQuestions.length === 0 && <p className={styles.emptySelected}>Drag questions here or select using checkboxes.</p>}
                  <SelectedQuestions questions={selectedQuestions} onRemove={handleRemoveSelected} />
                  {provided.placeholder}
                </div>
               )}
             </Droppable>
            <div className={styles.generateControls}>
                <button onClick={handleOpenSettings} disabled={selectedQuestions.length === 0 || isLoading || isGenerating} className={styles.generateButton}>
                  Generate Document...
                </button>
            </div>
          </aside>
        </div>
        {showSettingsModal && ( <DocumentSettingsModal onClose={() => setShowSettingsModal(false)} onGenerate={handleGenerateDocument} isGenerating={isGenerating} /> )}
      </div>
    </DragDropContext>
  );
}

export default App;