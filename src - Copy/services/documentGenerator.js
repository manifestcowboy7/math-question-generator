// src/services/documentGenerator.js

// --- (Keep all imports at the top) ---
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Packer, Document, Paragraph, TextRun, Numbering, LevelFormat, Header, Footer, PageNumber, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// --- (Keep generateDocument function) ---
export const generateDocument = async (questions, settings) => { /* ... */ };

// --- (Keep generatePdf function) ---
const generatePdf = async (questions, title, includeAnswerKey) => { /* ... */ };


// --- CORRECTED DOCX Generation ---
const generateDocx = async (questions, title, includeAnswerKey) => {
    // --- !!! numbering declared ONLY ONCE here !!! ---
    const numbering = {
        config: [
            {
                reference: "question-numbering",
                levels: [ { level: 0, format: LevelFormat.DECIMAL, text: "%1.", indent: { left: 720, hanging: 360 } } ],
            },
            {
                reference: "answer-numbering",
                levels: [ { level: 0, format: LevelFormat.DECIMAL, text: "%1.", indent: { left: 720, hanging: 360 } } ],
            },
        ],
    };
    // --- End single declaration ---

    const createQuestionParagraphs = (items) => items.map(q =>
        new Paragraph({
            children: [new TextRun(q.question_text || "[No question text]")],
            numbering: { reference: "question-numbering", level: 0 },
            spacing: { after: 120 }
        })
    );

    const createAnswerParagraphs = (items) => items.map(q =>
        new Paragraph({
            children: [new TextRun(q.correct_answer || "N/A")],
            numbering: { reference: "answer-numbering", level: 0 },
            spacing: { after: 120 }
        })
    );

    let sections = [{
        properties: {},
        headers: { default: new Header({ children: [new Paragraph(title)] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [ new TextRun("Page "), new TextRun({ children: [PageNumber.CURRENT] }), new TextRun(" of "), new TextRun({ children: [PageNumber.TOTAL_PAGES] }) ], })] }) },
        children: [
            new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
            new Paragraph({ text: "Questions", heading: HeadingLevel.HEADING_2, spacing: { after: 120 }}),
            ...createQuestionParagraphs(questions)
        ],
    }];

    if (includeAnswerKey) {
        sections.push({
             properties: { page: { pageBreakBefore: true } },
             headers: { default: new Header({ children: [new Paragraph(title)] }) },
             footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [ new TextRun("Page "), new TextRun({ children: [PageNumber.CURRENT] }), new TextRun(" of "), new TextRun({ children: [PageNumber.TOTAL_PAGES] }) ], })] }) },
             children: [
                 new Paragraph({ text: "Answer Key", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
                 ...createAnswerParagraphs(questions)
             ]
         });
    }

    const doc = new Document({
        numbering: numbering, // Use the single numbering definition
        sections: sections,
        styles: { paragraphStyles: [ { id: "Normal", name: "Normal", run: { size: 22 } } ] }
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);
};
// --- End Corrected DOCX Generation ---


// --- (Keep generateTxt function) ---
const generateTxt = (questions, title, includeAnswerKey) => { /* ... */ };