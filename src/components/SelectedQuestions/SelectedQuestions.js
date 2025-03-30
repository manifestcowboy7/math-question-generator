import React from 'react';
import { Draggable } from '@hello-pangea/dnd'; // Correct DnD import
import styles from './SelectedQuestions.module.css';

// Displays the list of questions selected by the user, allows removal and reordering
function SelectedQuestions({ questions = [], onRemove }) { // Default to empty array

  return (
    // The parent component (`App.js`) should contain the `Droppable` wrapper
    <div className={styles.selectedQuestionsList}>
      {questions.map((question, index) => (
        // Each item needs to be wrapped in Draggable
        <Draggable key={question.id} draggableId={String(question.id)} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps} // The drag handle props attach to this div
              className={`${styles.selectedItem} ${snapshot.isDragging ? styles.dragging : ''}`}
              style={{
                ...provided.draggableProps.style, // Apply styles from react-beautiful-dnd
              }}
            >
              <span className={styles.itemIndex}>{index + 1}.</span>
              <span className={styles.itemText} title={question.text}>
                 {/* Show truncated text */}
                 {question.text ? (question.text.length > 80 ? question.text.substring(0, 80) + '...' : question.text) : 'Missing text'}
              </span>
              <button
                onClick={() => onRemove(question.id)}
                className={styles.removeButton}
                aria-label={`Remove question: ${question.text?.substring(0, 30)}...`}
              >
                × {/* Simple remove icon */}
              </button>
            </div>
          )}
        </Draggable>
      ))}
      {/* Droppable provides a placeholder when dragging */}
      {/* The placeholder comes from the Droppable wrapper in App.js */}
    </div>
  );
}

export default SelectedQuestions;