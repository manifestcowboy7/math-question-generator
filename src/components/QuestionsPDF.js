// src/components/QuestionsPDF.js
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// --- Font Registration ---
// Using standard Helvetica as a safe default. If you have custom fonts,
// make sure the paths are correct and the fonts are available where the PDF is generated.
// Font.register({
//    family: 'Helvetica-Bold',
//    src: 'path/to/helvetica-bold.ttf' // Example path
// });

// --- Define Styles (Adjust as needed) ---
const styles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#FFFFFF', paddingTop: 30, paddingBottom: 50, paddingHorizontal: 40, fontFamily: 'Helvetica' },
    sectionTitle: { fontSize: 16, textAlign: 'center', marginBottom: 15, marginTop: 10, fontFamily: 'Helvetica-Bold', textDecoration: 'underline' },
    pageNumber: { position: 'absolute', fontSize: 9, bottom: 25, left: 0, right: 40, textAlign: 'right', color: 'grey' },
    // Default Layout
    defaultQuestionBlock: { marginBottom: 15, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#CCCCCC', borderBottomStyle: 'dashed' },
    defaultQuestionNumber: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginRight: 5 },
    defaultQuestionTextContent: { fontSize: 11, lineHeight: 1.4, flexShrink: 1 }, // Allow text to shrink/wrap
    defaultQuestionWrapper: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start'}, // Align items top
    defaultAnswerText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#333333', marginTop: 4, marginLeft: 15 },
    defaultMetaText: { fontSize: 9, color: '#555555', marginTop: 4, marginLeft: 15 },
    defaultAnswerPlaceholder: { flexDirection: 'row', alignItems: 'center', fontSize: 10, color: '#888888', marginTop: 10, marginBottom: 5, marginLeft: 15 },
    defaultAnswerSpacingView: { height: 35, marginLeft: 15 },
    // Grid Layout
    gridContainer: { display: 'flex', flexDirection: 'column', width: '100%', flexGrow: 1 },
    gridRow: { display: 'flex', flexDirection: 'row', width: '100%', flexGrow: 1, minHeight: '45%' }, // Adjust minHeight as needed
    gridCell: { width: '50%', padding: 10, borderWidth: 0.5, borderColor: '#CCCCCC', borderStyle: 'solid', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    gridQuestionNumber: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 3, color: '#555' },
    gridQuestionText: { fontSize: 8, lineHeight: 1.3, marginBottom: 'auto', paddingBottom: 4, flexGrow: 1 },
    gridAnswerText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#333333', paddingTop: 4 },
    gridMetaText: { fontSize: 7, color: '#555555', marginTop: 2 },
    gridAnswerPlaceholder: { flexDirection: 'row', alignItems: 'center', fontSize: 8, color: '#888888', paddingTop: 4 },
    gridEmptyCell: { width: '50%', padding: 10, borderWidth: 0.5, borderColor: '#CCCCCC', borderStyle: 'dashed', backgroundColor: '#f8f8f8' }
});

// Helper Function to chunk array (Keep as is)
const chunkArray = (array, size) => { const chunkedArr = []; for (let i = 0; i < array.length; i += size) { chunkedArr.push(array.slice(i, i + size)); } return chunkedArr; };


// --- Default Single Column Renderer ---
const renderDefaultLayout = (questions, isTeacherVersion) => {
    return questions.map((question, index) => {
        // --- *** UPDATED DATA ACCESS *** ---
        const questionText = question?.question_text ?? '[No Question Text]';
        const dokValue = question?.dok ?? 'N/A';
        // ❗ Verify this path based on your actual answer_data structure!
        const correctAnswer = question?.answer_data?.correct_answer ?? 'N/A';
        const topicTitle = question?.success_criteria?.learning_intentions?.topics?.title ?? 'N/A';
        // ❗ This shows only the *first* standard's description. Adjust if needed.
        const standardDesc = question?.success_criteria?.learning_intentions?.learning_intention_standards?.[0]?.standards?.description ?? null;
        // --- *** END UPDATED DATA ACCESS *** ---

        return (
            <View key={question.id} style={styles.defaultQuestionBlock} wrap={false}>
                <View style={styles.defaultQuestionWrapper}>
                    <Text style={styles.defaultQuestionNumber}>{`${index + 1}.`}</Text>
                    {/* Use updated variable */}
                    <Text style={styles.defaultQuestionTextContent}>{questionText}</Text>
                </View>
                {isTeacherVersion ? (
                    <>
                        {/* Use updated variable */}
                        <Text style={styles.defaultAnswerText}>Answer: {correctAnswer}</Text>
                        {/* Use updated variables */}
                        <Text style={styles.defaultMetaText}>
                            {`DOK: ${dokValue} | Topic: ${topicTitle}${standardDesc ? ` | Standard: ${standardDesc}` : ''}`}
                        </Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.defaultAnswerPlaceholder}>Answer: </Text>
                        <View style={styles.defaultAnswerSpacingView} />
                    </>
                )}
            </View>
        );
    });
};

// --- Grid 2x2 Renderer ---
const renderGrid2x2Layout = (questions, isTeacherVersion, documentTitle, startIndex = 0) => {
    const pages = chunkArray(questions, 4);

    return pages.map((pageQuestions, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" style={styles.page} break={pageIndex > 0}>
            {pageIndex === 0 && (
                 <Text style={styles.sectionTitle}>
                     {isTeacherVersion ? `${documentTitle} - Answer Key` : `${documentTitle}`}
                 </Text>
             )}
             <View style={styles.gridContainer}>
                 {[0, 1].map(rowIndex => (
                     <View key={`row-${rowIndex}`} style={styles.gridRow}>
                         {[0, 1].map(cellIndex => {
                             const questionIndex = rowIndex * 2 + cellIndex;
                             const question = pageQuestions[questionIndex];
                             const overallQuestionIndex = startIndex + (pageIndex * 4) + questionIndex;
                             if (question) {
                                 // --- *** UPDATED DATA ACCESS *** ---
                                 const questionText = question?.question_text ?? '[No Text]';
                                 const dokValue = question?.dok ?? 'N/A';
                                 // ❗ Verify answer path
                                 const correctAnswer = question?.answer_data?.correct_answer ?? 'N/A';
                                 const topicTitle = question?.success_criteria?.learning_intentions?.topics?.title ?? 'N/A';
                                 // ❗ Only first standard shown
                                 // const standardDesc = question?.success_criteria?.learning_intentions?.learning_intention_standards?.[0]?.standards?.description ?? null;
                                 // --- *** END UPDATED DATA ACCESS *** ---

                                 return (
                                     <View key={`cell-${question.id}`} style={styles.gridCell}>
                                         <Text style={styles.gridQuestionNumber}>{`${overallQuestionIndex + 1}.`}</Text>
                                         {/* Use updated variable */}
                                         <Text style={styles.gridQuestionText}>{questionText}</Text>
                                         {isTeacherVersion ? (
                                             <>
                                                 {/* Use updated variable */}
                                                 <Text style={styles.gridAnswerText}>Answer: {correctAnswer}</Text>
                                                 {/* Use updated variables */}
                                                 <Text style={styles.gridMetaText}>{`DOK: ${dokValue} | Topic: ${topicTitle}`}</Text>
                                                  {/* Removed standard from grid for brevity, add back if needed */}
                                             </>
                                         ) : (
                                             <Text style={styles.gridAnswerPlaceholder}>Answer:</Text>
                                         )}
                                     </View>
                                 );
                             } else {
                                 return <View key={`empty-cell-${rowIndex}-${cellIndex}`} style={styles.gridEmptyCell} />;
                             }
                         })}
                     </View>
                 ))}
             </View>
            <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
        </Page>
    ));
};


// --- The Main PDF Document Component ---
const QuestionsPDF = ({ questions, templateId = 'default', documentTitle = 'Worksheet', isTeacherVersion = false }) => {

    const safeDocumentTitle = documentTitle || 'Worksheet';

    // Ensure questions is an array before proceeding
    if (!Array.isArray(questions) || questions.length === 0) {
        console.warn("QuestionsPDF: Received invalid or empty questions array.");
        return (
            <Document title={safeDocumentTitle}>
                <Page size="A4" style={styles.page}>
                    <Text style={styles.sectionTitle}>{safeDocumentTitle}</Text>
                    <Text style={{ textAlign: 'center', fontSize: 11, color: 'red' }}>No valid questions were provided to generate the document.</Text>
                </Page>
            </Document>
        );
    }

    // Optional: Log the structure of the first question to help verify paths
    // if (questions.length > 0) {
    //    console.log("QuestionsPDF: Structure of first question:", JSON.stringify(questions[0], null, 2));
    // }


    let pages;

    // --- Choose rendering logic based on templateId ---
    try { // Add try...catch for safety during rendering
      switch (templateId) {
          case 'grid2x2':
              pages = renderGrid2x2Layout(questions, isTeacherVersion, safeDocumentTitle, 0);
              break;

          case 'default':
          default:
              pages = (
                  <Page size="A4" style={styles.page}>
                      <Text style={styles.sectionTitle}>
                          {isTeacherVersion ? `${safeDocumentTitle} - Answer Key` : safeDocumentTitle}
                      </Text>
                      {renderDefaultLayout(questions, isTeacherVersion)}
                      <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber}`} fixed />
                  </Page>
              );
              break;
      }
    } catch (error) {
        console.error("Error rendering PDF pages:", error);
        pages = (
            <Page size="A4" style={styles.page}>
                 <Text style={styles.sectionTitle}>Error</Text>
                 <Text style={{color: 'red', fontSize: 10}}>An error occurred while generating the PDF content: {error.message}</Text>
            </Page>
        );
    }

    // Return the Document containing the generated pages
    return (
        <Document title={safeDocumentTitle}>
            {pages}
        </Document>
    );
};

export default QuestionsPDF;