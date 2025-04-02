// src/components/QuestionsPDF.js
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// --- Optional: Register Fonts ---
// If you need specific fonts (especially for special characters or non-Latin scripts)
// Font.register({
//   family: 'Oswald',
//   src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
// });

// --- Define Styles ---
// Styles are defined using StyleSheet.create, similar to React Native
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30, // Add padding to the page
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    // fontFamily: 'Oswald', // Example font usage
  },
  questionBlock: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    borderBottomStyle: 'dashed',
  },
  questionText: {
    fontSize: 11,
    marginBottom: 5,
    lineHeight: 1.4, // Improve readability
  },
  metaText: {
    fontSize: 9,
    color: '#555555',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
});

// --- The PDF Document Component ---
const QuestionsPDF = ({ questions }) => (
  <Document>
    {/* You can add metadata here */}
    {/* <title>Selected Math Questions</title> */}
    {/* <author>Math Question Generator</author> */}

    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Selected Math Questions</Text>

      {questions.map((question, index) => (
        <View key={question.id} style={styles.questionBlock} wrap={false}>
          {/* Adding index+1 for question numbering */}
          <Text style={styles.questionText}>
             {`${index + 1}. ${question.question_text}`} {/* Basic text rendering */}
             {/* NOTE: Complex math (fractions, exponents) might not render correctly here.
                 You might need to rely on Unicode or pre-process math into a simpler format
                 if your parseMathText doesn't already handle this for plain text output. */}
          </Text>
          <Text style={styles.metaText}>
            DOK: {question.dok ?? 'N/A'} | Topic: {question.topic ?? 'N/A'}
          </Text>
          {/* Add other details like Standard or LO if desired */}
          {/* {question.standard && <Text style={styles.metaText}>Standard: {question.standard}</Text>} */}
        </View>
      ))}

      {/* Add Page Numbers */}
       <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
         `${pageNumber} / ${totalPages}`
       )} fixed />
    </Page>
  </Document>
);

export default QuestionsPDF;