// src/pages/FinalizePdfPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    PDFDownloadLink,
    pdf
} from '@react-pdf/renderer';
import { BsGripVertical } from 'react-icons/bs';
import { FaSpinner } from 'react-icons/fa';
import QuestionsPDF from '../components/QuestionsPDF';
import Modal from 'react-modal';

// --- Helper Functions ---
// Moved BEFORE the styles object that might use them indirectly (though unlikely here)
// or defined constants they might use. Good practice to define functions before use.
const formatQuestionTypeDisplay = (type) => {
    if (!type) return 'N/A';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const calculateDokAnalysis = (selectedQuestions) => {
    const counts = {}; let total = 0;
    if (Array.isArray(selectedQuestions)) {
        selectedQuestions.forEach(q => {
            const dok = q?.dok;
            if (dok != null && !isNaN(dok)) { counts[dok] = (counts[dok] || 0) + 1; total++; }
        });
    }
    const breakdown = Object.entries(counts).map(([label, count]) => ({ label: String(label), count, percentage: total === 0 ? '0.0' : ((count / total) * 100).toFixed(1) })).sort((a, b) => parseInt(a.label) - parseInt(b.label));
    return { total, breakdown };
};

const calculateTypeAnalysis = (selectedQuestions) => {
    const counts = {}; let total = 0;
    if (Array.isArray(selectedQuestions)) {
        selectedQuestions.forEach(q => {
            const type = q?.question_type;
            if (type) { const formattedLabel = formatQuestionTypeDisplay(type); counts[formattedLabel] = (counts[formattedLabel] || 0) + 1; total++; }
        });
    }
    const breakdown = Object.entries(counts).map(([label, count]) => ({ label, count, percentage: total === 0 ? '0.0' : ((count / total) * 100).toFixed(1) }));
    return { total, breakdown };
};

const calculateTopicAnalysis = (selectedQuestions) => {
    const counts = {}; let total = 0;
    if (Array.isArray(selectedQuestions)) {
        selectedQuestions.forEach(q => {
            const topic = q?.success_criteria?.learning_intentions?.topics?.title;
            if (topic) { counts[topic] = (counts[topic] || 0) + 1; total++; }
        });
    }
    const breakdown = Object.entries(counts).map(([label, count]) => ({ label, count, percentage: total === 0 ? '0.0' : ((count / total) * 100).toFixed(1) }));
    return { total, breakdown };
};

const sanitizeFilename = (title) => title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'document';

// --- Styles Object ---
// Ensure this object is correctly structured with commas between key-value pairs
// and a final closing brace.
const styles = {
  pageContainer: { padding: '20px', maxWidth: '1200px', margin: '20px auto', fontFamily: 'sans-serif' },
  nav: { marginBottom: '15px' },
  backLink: { textDecoration: 'none', color: '#007bff', marginRight: '20px', fontWeight: '500' },
  pageTitle: { borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.6em', color: '#333' },
  mainLayout: {
      display: 'flex',
      gap: '25px',
      alignItems: 'flex-start'
    },
  leftColumn: { // The overall container for the left side
      flex: '0 0 300px',
      position: 'sticky',
      top: '20px',
      padding: '20px',
      backgroundColor: '#fff', // **Ensure this line ends with a comma if followed by more keys**
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 40px)'
    }, // **Comma added here if needed, or ensure brace is correct**
  analysisScrollArea: { // The TOP section that should scroll
      flex: '1 1 auto',
      overflowY: 'auto',
      marginBottom: '20px',
      paddingRight: '5px',
      minHeight: '50px',
    },
  actionsContainer: { // The BOTTOM section that should be fixed
      flexShrink: 0,
      // Removed marginTop: 'auto'
      paddingTop: '15px',
      borderTop: '1px solid #eee',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
    },
  rightColumn: { // Right column setup
      flex: '1 1 auto',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 40px)',
      minHeight: '400px',
    },
  questionListContainer: { // Scrolling area within the right column
        flex: '1 1 auto',
        overflowY: 'auto',
        paddingRight: '8px',
        minHeight: '100px',
    },
  sectionTitle: { // Title within right column (fixed part)
        marginBottom: '15px',
        fontSize: '1.3em',
        color: '#333',
        flexShrink: 0
    },
  analysisTitle: { fontSize: '1.1em', fontWeight: '600', color: '#444', marginBottom: '10px', paddingTop: '10px', borderTop: '1px solid #eee', marginTop:'15px' },
  analysisBox: { background: '#f8f9fa', border: '1px solid #eee', padding: '15px', borderRadius: '5px', fontSize: '0.9em', lineHeight: '1.5', marginBottom: '15px' },
  analysisGrid: { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '5px 10px', marginBottom: '10px', alignItems: 'baseline'},
  analysisItem: { display: 'contents'},
  analysisLabel: { fontWeight: '500', color: '#333', textAlign: 'left' },
  analysisValueCount: { textAlign: 'right', fontWeight: '500' },
  analysisValuePercent: { textAlign: 'right', color: '#555', fontSize: '0.9em' },
  analysisTotal: { gridColumn: '1 / -1', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ccc', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: '0.95em'},
  questionList: { listStyle: 'none', padding: 0, margin: 0 },
  sortableItem: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'grab', fontSize: '0.95em', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s ease, opacity 0.2s ease, background-color 0.1s ease', justifyContent: 'space-between' },
  sortableItemContent: { display: 'flex', flexDirection: 'column', gap: '5px', flexGrow: 1 },
  sortableItemText: { fontWeight: '500', color: '#222', lineHeight: '1.3' },
  sortableItemMeta: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '0.8em' },
  metaPill: { padding: '2px 8px', borderRadius: '10px', fontWeight: '500', whiteSpace: 'nowrap' },
  dokPill: { backgroundColor: '#cfe2ff', color: '#0a367e' },
  typePill: { backgroundColor: '#e2d9f3', color: '#4f3f7b' },
  topicPill: { backgroundColor: '#d1e7dd', color: '#0f5132' },
  sortableItemDragging: { opacity: 0.7, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', cursor: 'grabbing', backgroundColor: '#eef' },
  dragHandleIndicator: { cursor: 'grab', color: '#aaa', fontSize: '1.2em', lineHeight: '1', alignSelf: 'center', marginRight: '5px' },
  removeButton: { marginLeft: '10px', background: 'none', border: 'none', color: '#cc0000', cursor: 'pointer', fontSize: '1.1rem', padding: '2px 5px', lineHeight: 1, borderRadius: '3px', transition: 'background-color 0.2s ease, color 0.2s ease', alignSelf: 'center' },
  removeButtonHover: { color: '#ff0000', backgroundColor: '#ffeeee' },
  titleInputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  titleLabel: { fontSize: '0.9em', fontWeight: '600', color: '#444' },
  titleInput: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' },
  answerToggleGroup: { display: 'flex', alignItems: 'center', gap: '10px', margin: '5px 0' },
  answerToggleLabel: { cursor: 'pointer', fontSize: '0.95em', fontWeight: '500', userSelect: 'none' },
  answerToggleInput: { cursor: 'pointer' },
  buttonGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  button: { padding: '9px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.95em', fontWeight: '500', transition: 'background-color 0.2s ease, opacity 0.2s ease', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2', boxSizing: 'border-box', whiteSpace: 'nowrap', textAlign: 'center', minWidth: '110px', flexShrink: 0, gap: '8px' },
  previewButton: { backgroundColor: '#28a745', color: 'white' },
  downloadButton: { backgroundColor: '#007bff', color: 'white', textDecoration: 'none', },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  errorText: { color: 'red', marginTop: '10px', fontSize: '0.9em' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalContent: { position: 'relative', background: '#fff', borderRadius: '8px', padding: '0', width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
  modalHeader: { padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  modalTitle: { margin: 0, fontSize: '1.25em', color: '#333' },
  modalCloseBtn: { background: 'none', border: 'none', fontSize: '1.8em', cursor: 'pointer', color: '#aaa', lineHeight: '1', padding: '0 5px' },
  modalCloseBtnHover: { color: '#555' },
  modalBody: { padding: '20px', overflowY: 'auto', flexGrow: 1 },
  modalBodyIframe: { width: '100%', height: '65vh', border: 'none' },
  modalBodyText: { textAlign: 'center', padding: '30px', color: '#555' },
  modalFooter: { padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 },
  modalCancelBtn: { backgroundColor: '#6c757d', color: 'white' },
  spinner: { animation: 'spin 1s linear infinite' },
  '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
}; // **Ensure this is the final closing brace for the styles object**

// Must call Modal.setAppElement after styles definition
Modal.setAppElement('#root');

// --- Enhanced Sortable Item Component ---
function SortableItem({ id, question, index, handleRemove }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const transformStyle = transform ? CSS.Transform.toString(transform) : undefined;
    const itemStyle = {
        transform: transformStyle, transition,
        ...(isDragging ? styles.sortableItemDragging : {}),
        ...styles.sortableItem
    };
    const questionText = question?.question_text ?? 'Question text missing';
    const dokValue = question?.dok ?? null;
    const questionType = question?.question_type ?? null;
    const topicTitle = question?.success_criteria?.learning_intentions?.topics?.title ?? null;
    const formattedType = formatQuestionTypeDisplay(questionType);

    return (
        <li ref={setNodeRef} style={itemStyle} {...attributes} >
            <span {...listeners} style={styles.dragHandleIndicator} title="Drag to reorder"><BsGripVertical /></span>
            <div style={styles.sortableItemContent}>
                <span style={styles.sortableItemText} title={questionText}> {index + 1}. {questionText.length > 120 ? `${questionText.substring(0, 120)}...` : questionText} </span>
                <div style={styles.sortableItemMeta}>
                    {dokValue !== null && ( <span style={{...styles.metaPill, ...styles.dokPill}}>DOK: {dokValue}</span> )}
                    {questionType && ( <span style={{...styles.metaPill, ...styles.typePill}}>{formattedType}</span> )}
                    {topicTitle && ( <span style={{...styles.metaPill, ...styles.topicPill}} title={topicTitle}> Topic: {topicTitle.length > 25 ? `${topicTitle.substring(0, 25)}...` : topicTitle} </span> )}
                </div>
            </div>
            <button onClick={() => handleRemove(id)} style={styles.removeButton} onMouseEnter={(e) => { const t = e.currentTarget; t.style.color = styles.removeButtonHover.color; t.style.backgroundColor = styles.removeButtonHover.backgroundColor; }} onMouseLeave={(e) => { const t = e.currentTarget; t.style.color = '#cc0000'; t.style.backgroundColor = 'transparent'; }} title="Remove question">×</button>
        </li>
    );
}


// --- Main Finalize Page Component ---
function FinalizePdfPage() {
  const location = useLocation();

  // --- State Initialization ---
  const initialQuestionsRaw = location.state?.questions || [];
  const initialQuestionsFiltered = initialQuestionsRaw.filter(q => q && q.id != null);
  const [orderedQuestions, setOrderedQuestions] = useState(initialQuestionsFiltered);
  const [pdfTitle, setPdfTitle] = useState('Worksheet');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- Memoized Calculations ---
  const currentDokAnalysis = useMemo(() => calculateDokAnalysis(orderedQuestions), [orderedQuestions]);
  const currentTypeAnalysis = useMemo(() => calculateTypeAnalysis(orderedQuestions), [orderedQuestions]);
  const currentTopicAnalysis = useMemo(() => calculateTopicAnalysis(orderedQuestions), [orderedQuestions]);

  // --- Effect Hooks ---
  useEffect(() => {}, []);
  useEffect(() => {
    const updatedRawQuestions = location.state?.questions || [];
    const updatedFilteredQuestions = updatedRawQuestions.filter(q => q && q.id != null);
    if (JSON.stringify(updatedFilteredQuestions.map(q => q.id)) !== JSON.stringify(orderedQuestions.map(q => q.id))) {
      setOrderedQuestions(updatedFilteredQuestions);
    }
  }, [location.state?.questions]);

  // --- Drag and Drop Setup ---
  const sensors = useSensors( useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }) );

  // --- Derived State & Checks ---
  const questionIds = useMemo(() => orderedQuestions.map(q => q.id), [orderedQuestions]);
  const hasDuplicateIds = useMemo(() => questionIds.length !== new Set(questionIds).size, [questionIds]);
  const downloadFilename = useMemo(() => `${sanitizeFilename(pdfTitle)}_${includeAnswers ? 'KEY' : 'Worksheet'}.pdf`, [pdfTitle, includeAnswers]);
  const pdfDocumentInstance = useMemo(() => ( <QuestionsPDF questions={orderedQuestions} documentTitle={pdfTitle || 'Document'} isTeacherVersion={includeAnswers}/> ), [orderedQuestions, pdfTitle, includeAnswers]);
  const canPreviewOrDownload = useMemo(() => pdfTitle.trim() && orderedQuestions.length > 0 && !hasDuplicateIds && !isGeneratingPreview && !isDownloading, [pdfTitle, orderedQuestions, hasDuplicateIds, isGeneratingPreview, isDownloading]);

  // --- Event Handlers ---
   function handleDragEnd(event) { const { active, over } = event; if (over && active.id !== over.id) { setOrderedQuestions((items) => { if (!Array.isArray(items)) return []; const oldIndex = items.findIndex(i => i?.id === active.id); const newIndex = items.findIndex(i => i?.id === over.id); if (oldIndex !== -1 && newIndex !== -1) { return arrayMove(items, oldIndex, newIndex); } return items; }); } }
   const handlePreview = async () => { if (!canPreviewOrDownload && isGeneratingPreview) return; setIsGeneratingPreview(true); setPreviewError(null); setPreviewUrl(null); try { const blob = await pdf(pdfDocumentInstance).toBlob(); const url = URL.createObjectURL(blob); setPreviewUrl(url); setShowPreviewModal(true); } catch (e) { console.error("Error PDF preview:", e); setPreviewError(`Preview failed: ${e.message}`); } finally { setIsGeneratingPreview(false); } };
   const handleClosePreview = () => { setShowPreviewModal(false); if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); } setPreviewError(null); };
   const handleRemoveQuestion = (idToRemove) => { setOrderedQuestions(prev => prev.filter(q => q && q.id !== idToRemove)); };

  // --- Conditional Return Logic for Invalid State ---
  const isValidState = initialQuestionsFiltered.length > 0;
  if (!location.state?.questions && initialQuestionsRaw.length === 0) { return ( <div style={styles.pageContainer}><nav style={styles.nav}><Link to="/" style={styles.backLink}>← Back</Link></nav><h2>Error</h2><p>No questions selected.</p></div> ); }
  else if (!isValidState && initialQuestionsRaw.length > 0) { return ( <div style={styles.pageContainer}><nav style={styles.nav}><Link to="/" style={styles.backLink}>← Back</Link></nav><h2>Data Error</h2><p>Cannot process questions.</p></div> ); }

  // --- Render the main component ---
  const modalDownloadLinkStyle = { ...styles.button, ...styles.downloadButton, ...(!canPreviewOrDownload && !isDownloading ? styles.buttonDisabled : {}), ...(isDownloading ? styles.buttonDisabled : {}) };
  const previewButtonStyle = { ...styles.button, ...styles.previewButton, ...(!canPreviewOrDownload && !isGeneratingPreview ? styles.buttonDisabled : {}), ...(isGeneratingPreview ? styles.buttonDisabled : {}) };
  const downloadButtonStyle = { ...styles.button, ...styles.downloadButton, ...(!canPreviewOrDownload && !isDownloading ? styles.buttonDisabled : {}), ...(isDownloading ? styles.buttonDisabled : {}) };

  return (
    <div style={styles.pageContainer}>
       <nav style={styles.nav}> <Link to="/" style={styles.backLink}>← Back to Selection</Link> </nav>
       <h2 style={styles.pageTitle}>Finalize Document ({orderedQuestions.length} Questions)</h2>
       <div style={styles.mainLayout}>

           {/* === Left Column === */}
           <div style={styles.leftColumn}>
                 {/* Section 1: Scrollable Analysis Area */}
                 <div style={styles.analysisScrollArea}>
                    <h3 style={{...styles.sectionTitle, borderBottom: '1px solid #eee', paddingBottom: '10px', flexShrink: 0}}> Selection Analysis </h3>
                    {/* Analysis Sections */}
                    {currentDokAnalysis.total > 0 ? ( <div style={styles.analysisBox}><h4 style={styles.analysisTitle}>DOK Levels</h4><div style={styles.analysisGrid}>{currentDokAnalysis.breakdown.map(item => ( <div key={`dok-${item.label}`} style={styles.analysisItem}><span style={styles.analysisLabel}>DOK {item.label}:</span><span style={styles.analysisValueCount}>{item.count}</span><span style={styles.analysisValuePercent}>({item.percentage}%)</span></div> ))}</div><div style={styles.analysisTotal}><span>Total</span><span>{currentDokAnalysis.total}</span></div></div> ) : null}
                    {currentTypeAnalysis.total > 0 ? ( <div style={styles.analysisBox}><h4 style={styles.analysisTitle}>Question Types</h4><div style={styles.analysisGrid}>{currentTypeAnalysis.breakdown.map(item => ( <div key={`type-${item.label}`} style={styles.analysisItem}><span style={styles.analysisLabel}>{item.label}:</span><span style={styles.analysisValueCount}>{item.count}</span><span style={styles.analysisValuePercent}>({item.percentage}%)</span></div> ))}</div><div style={styles.analysisTotal}><span>Total</span><span>{currentTypeAnalysis.total}</span></div></div> ) : null}
                    {currentTopicAnalysis.total > 0 ? ( <div style={styles.analysisBox}><h4 style={styles.analysisTitle}>Topics Covered</h4><ul style={{paddingLeft: '20px', margin: '0 0 10px 0', fontSize: '0.9em'}}>{currentTopicAnalysis.breakdown.map(item => ( <li key={`topic-${item.label}`} style={{marginBottom: '4px'}}>{item.label} ({item.count} {item.count === 1 ? 'q' : 'qs'})</li> ))}</ul><div style={styles.analysisTotal}><span>Total Questions</span><span>{currentTopicAnalysis.total}</span></div></div> ) : null}
                    {currentDokAnalysis.total === 0 && currentTypeAnalysis.total === 0 && currentTopicAnalysis.total === 0 && orderedQuestions.length > 0 && ( <p style={{fontSize: '0.9em', color: '#666', textAlign:'center', marginTop: '20px'}}>Analysis data unavailable.</p> )}
                 </div>
                 {/* Section 2: Fixed Actions Area */}
                 <div style={styles.actionsContainer}>
                     <div style={styles.titleInputGroup}> <label htmlFor="pdfTitleInput" style={styles.titleLabel}>Document Title:</label> <input type="text" id="pdfTitleInput" style={styles.titleInput} value={pdfTitle} onChange={(e) => setPdfTitle(e.target.value)} placeholder="Enter PDF Title" disabled={isGeneratingPreview || isDownloading} /> </div>
                     <div style={styles.answerToggleGroup}> <input type="checkbox" id="includeAnswersToggle" checked={includeAnswers} onChange={(e) => setIncludeAnswers(e.target.checked)} disabled={isGeneratingPreview || isDownloading} style={styles.answerToggleInput}/> <label htmlFor="includeAnswersToggle" style={styles.titleLabel}> Include Answer Key / Metadata </label> </div>
                     <div style={styles.buttonGroup}>
                         <button onClick={handlePreview} disabled={!canPreviewOrDownload && !isGeneratingPreview} style={previewButtonStyle}> {isGeneratingPreview ? <FaSpinner style={styles.spinner}/> : null} {isGeneratingPreview ? 'Generating...' : 'Preview PDF'} </button>
                         <PDFDownloadLink document={pdfDocumentInstance} fileName={downloadFilename} style={downloadButtonStyle} aria-disabled={!canPreviewOrDownload && !isDownloading} onClick={() => { if (canPreviewOrDownload) { setIsDownloading(true); setTimeout(() => setIsDownloading(false), 1500); } }}>
                           {({ loading }) => ( <>{(loading || isDownloading) ? <FaSpinner style={styles.spinner}/> : null}{(loading || isDownloading) ? 'Preparing...' : 'Download PDF'}</> )}
                         </PDFDownloadLink>
                      </div>
                      {previewError && <p style={styles.errorText}>{previewError}</p>}
                      {hasDuplicateIds && <p style={styles.errorText}>Warning: Duplicate question IDs detected.</p>}
                 </div>
           </div>

           {/* === Right Column === */}
           <div style={styles.rightColumn}>
                <h3 style={styles.sectionTitle}>Arrange Questions</h3>
                <div style={styles.questionListContainer}>
                    {!hasDuplicateIds ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                                <ul style={styles.questionList}>
                                    {orderedQuestions.map((question, index) => ( question?.id != null ? ( <SortableItem key={question.id} id={question.id} question={question} index={index} handleRemove={handleRemoveQuestion}/> ) : null ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    ) : ( <p style={{ color: 'red', padding: '20px', textAlign: 'center' }}> Cannot arrange questions due to duplicate IDs... </p> )}
                    {orderedQuestions.length === 0 && initialQuestionsRaw.length > 0 && ( <p style={{ padding: '20px', textAlign: 'center', color: '#888' }}> No valid questions to display... </p> )}
                    {orderedQuestions.length === 0 && initialQuestionsRaw.length === 0 && ( <p style={{ padding: '20px', textAlign: 'center', color: '#888' }}> No questions selected. <Link to="/" style={{color: '#007bff'}}>Go back</Link> to select some. </p> )}
                </div>
           </div>
       </div> {/* End Flexbox Layout */}

       {/* Preview Modal */}
       <Modal isOpen={showPreviewModal} onRequestClose={handleClosePreview} contentLabel="PDF Preview" style={{ overlay: styles.modalOverlay, content: styles.modalContent }}>
           <div style={styles.modalHeader}> <h3 style={styles.modalTitle}>PDF Preview: {pdfTitle}</h3> <button onClick={handleClosePreview} style={styles.modalCloseBtn} onMouseEnter={(e) => e.currentTarget.style.color = styles.modalCloseBtnHover.color} onMouseLeave={(e) => e.currentTarget.style.color = '#aaa'} >×</button> </div>
           <div style={styles.modalBody}> {previewUrl ? <iframe title="PDF Preview" src={previewUrl} style={styles.modalBodyIframe}></iframe> : <p style={styles.modalBodyText}>{isGeneratingPreview ? 'Generating preview...' : 'No preview available.'}</p>} {previewError && <p style={{...styles.errorText, textAlign: 'center'}}>{previewError}</p>} </div>
           <div style={styles.modalFooter}> {previewUrl && <PDFDownloadLink document={pdfDocumentInstance} fileName={downloadFilename} style={modalDownloadLinkStyle} aria-disabled={!canPreviewOrDownload}> {({ loading }) => ( loading ? 'Preparing...' : 'Download PDF')} </PDFDownloadLink>} <button onClick={handleClosePreview} style={{...styles.button, ...styles.modalCancelBtn}}>Close</button> </div>
        </Modal>
    </div>
  );
}

export default FinalizePdfPage;