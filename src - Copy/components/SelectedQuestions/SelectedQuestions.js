// src/components/SelectedQuestions/SelectedQuestions.js
import React from 'react';
import { Draggable } from '@hello-pangea/dnd'; // Correct DnD import
import styles from './SelectedQuestions.module.css';

// Displays the list of questions selected by the user, allows removal and reordering
function SelectedQuestions({ questions = [], onRemove }) { // Default to empty array

  // --- NEW: Download Handler Function ---
  const handleDownload = () => {
    // 1. Check if there are any questions to download
    if (!questions || questions.length === 0) {
      alert("No questions selected to download."); // Use alert for simple feedback
      return; // Stop the function if there's nothing to download
    }

    // 2. Format the questions into a plain text string
    //    This format uses the index and the question text.
    //    If the 'question' object had an 'answer' field (e.g., question.answer),
    //    you could add it here like:
    //    return `${index + 1}. Question: ${question.text}\n   Answer: ${question.answer}\n\n`;
    const formattedText = questions.map((question, index) => {
      // Current format: Numbering and the question text, with line breaks between questions.
      return `${index + 1}. ${question.text || 'Missing text'}\n\n`; // Add double newline for readability
    }).join(''); // Join all formatted questions into one big string

    // 3. Create a Blob (like a temporary file in memory) from the text
    const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });

    // 4. Create a temporary URL that points to the Blob
    const url = URL.createObjectURL(blob);

    // 5. Create an invisible link element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'math_questions.txt'; // The default filename for the download

    // 6. Add the link to the page, click it programmatically, then remove it
    document.body.appendChild(link); // Add link to body
    link.click(); // Simulate a click to trigger download
    document.body.removeChild(link); // Remove link from body

    // 7. Clean up the temporary URL to free memory
    URL.revokeObjectURL(url);
  };
  // --- END NEW ---


  return (
    // --- MODIFIED: Added a wrapper div for better structure ---
    <div className={styles.selectedQuestionsContainer}>

      {/* Existing list rendering logic using Draggable */}
      <div className={styles.selectedQuestionsList}>
        {questions.map((question, index) => (
          <Draggable key={question.id} draggableId={String(question.id)} index={index}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`${styles.selectedItem} ${snapshot.isDragging ? styles.dragging : ''}`}
                style={{
                  ...provided.draggableProps.style,
                }}
              >
                <span className={styles.itemIndex}>{index + 1}.</span>
                <span className={styles.itemText} title={question.text}>
                  {question.text ? (question.text.length > 80 ? question.text.substring(0, 80) + '...' : question.text) : 'Missing text'}
                </span>
                <button
                  onClick={() => onRemove(question.id)}
                  className={styles.removeButton}
                  aria-label={`Remove question: ${question.text?.substring(0, 30)}...`}
                >
                  ×
                </button>
              </div>
            )}
          </Draggable>
        ))}
        {/* Droppable placeholder is handled by the parent component */}
      </div>

      {/* --- NEW: Download Button --- */}
      {/* Conditionally render the button only if there are questions */}
      {questions.length > 0 && (
         <div className={styles.downloadButtonContainer}> {/* Optional: for styling */}
           <button
             onClick={handleDownload}
             className={styles.downloadButton} // Optional: for styling
             title="Download the selected questions as a .txt file"
           >
             Download Selected (.txt)
           </button>
         </div>
       )}
      {/* --- END NEW --- */}

    </div> // --- MODIFIED: Closed the wrapper div ---
  );
}

export default SelectedQuestions;