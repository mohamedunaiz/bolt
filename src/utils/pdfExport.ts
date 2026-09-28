import { jsPDF } from "jspdf";
import { MainsAnswerEvaluation, MainsModelAnswer } from "../types";

/**
 * BOLT UPSC - High-Fidelity Mains Answer Evaluation & Model Answer PDF Export Engine
 * Formats multi-page official evaluation dossiers optimized for offline printing and review.
 */

interface PDFExportOptions {
  aspirantName?: string;
  targetExam?: string;
  autoPrint?: boolean;
}

export function exportMainsEvaluationPDF(
  evaluation: MainsAnswerEvaluation,
  options?: PDFExportOptions
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 14;

  const candidateName = options?.aspirantName || "UPSC Aspirant";
  const targetYear = options?.targetExam || "UPSC CSE 2026";
  const percentage = Math.round((evaluation.score / evaluation.maxMarks) * 100);

  // Helper: check page overflow and add new page
  const checkPageBreak = (neededHeight: number): void => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 16;
      drawSubsequentHeader();
    }
  };

  const drawSubsequentHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("BOLT UPSC - MAINS ANSWER EVALUATION DOSSIER", marginX, 10);
    doc.text(`CANDIDATE: ${candidateName.toUpperCase()}`, pageWidth - marginX, 10, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, 12, pageWidth - marginX, 12);
  };

  // 1. TOP HEADER BANNER
  doc.setFillColor(15, 23, 42); // Navy 900
  doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, "F");

  // Logo & Brand
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.roundedRect(marginX + 4, currentY + 4, 16, 16, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("⚡", marginX + 9, currentY + 14.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("BOLT UPSC ACADEMIC BRAIN", marginX + 24, currentY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text("Civil Services Mains Answer Evaluation & Diagnostic Report", marginX + 24, currentY + 16);

  // Right Side Meta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`REPORT #${evaluation.id.slice(-8).toUpperCase()}`, pageWidth - marginX - 4, currentY + 9, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), pageWidth - marginX - 4, currentY + 15, { align: "right" });

  currentY += 28;

  // 2. CANDIDATE & EXAM INFO STRIP
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(marginX, currentY, contentWidth, 14, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Aspirant:", marginX + 4, currentY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text(candidateName, marginX + 20, currentY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.text("Target:", marginX + 68, currentY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text(targetYear, marginX + 80, currentY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.text("Subject / Paper:", marginX + 118, currentY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text(evaluation.subject, marginX + 144, currentY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.text("Evaluator Engine:", marginX + 4, currentY + 10.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(2, 132, 199);
  doc.text("Bolt Academic Intelligence (Python 3.10 Engine + UPSC Rubric)", marginX + 32, currentY + 10.5);

  currentY += 18;

  // 3. SCORE SUMMARY CARD
  checkPageBreak(28);
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, "FD");

  // Big Score Block
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.roundedRect(marginX + 4, currentY + 3.5, 48, 17, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`${evaluation.score} / ${evaluation.maxMarks}`, marginX + 28, currentY + 12, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(191, 219, 254);
  doc.text(`MARKS AWARDED (${percentage}%)`, marginX + 28, currentY + 17, { align: "center" });

  // Evaluation Tier & Breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  let statusHeadline = "Good Conceptual Grasp — Needs Multi-Dimensional Thinker Grounding";
  if (percentage >= 70) {
    statusHeadline = "Topper Decile Quality — Exceptional Analytical Rigor & Structure";
  } else if (percentage < 50) {
    statusHeadline = "Foundational Stage — Crucial Gaps in Question Demand & Citations";
  }
  doc.text(statusHeadline, marginX + 56, currentY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Evaluated across 6 UPSC criteria. Recommended exam hall target: 11.5 - 13.0 Marks out of ${evaluation.maxMarks}.`,
    marginX + 56,
    currentY + 14
  );
  doc.text(
    `Submitted on ${evaluation.submittedDate || "Recent Session"} • UPSC Optional / General Studies Standard`,
    marginX + 56,
    currentY + 19
  );

  currentY += 28;

  // 4. QUESTION CARD
  checkPageBreak(24);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 22, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text("QUESTION EVALUATED (15 MARKS / 250 WORDS):", marginX + 4, currentY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const splitQuestion = doc.splitTextToSize(`"${evaluation.questionText}"`, contentWidth - 8);
  doc.text(splitQuestion, marginX + 4, currentY + 11);

  currentY += 26;

  // 5. UPSC MULTI-CRITERIA SCORING TABLE
  checkPageBreak(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("1. MULTI-CRITERIA UPSC RUBRIC ASSESSMENT", marginX, currentY);
  currentY += 4;

  const criteriaItems: { label: string; score: number }[] = [
    { label: "Question Demand & Directive Alignment", score: evaluation.criteria.questionDemand },
    { label: "Theoretical Grounding & Academic Content", score: evaluation.criteria.content },
    { label: "Structural Flow, Headings & Presentation", score: evaluation.criteria.structure },
    { label: "Critical Analysis & Counter-Arguments", score: evaluation.criteria.analysis },
    { label: "Indian Context, 2nd ARC & Committee Citations", score: evaluation.criteria.examples },
    { label: "Pragmatic Way Forward & Visionary Conclusion", score: evaluation.criteria.conclusion },
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("EVALUATION PARAMETER", marginX + 4, currentY + 4.2);
  doc.text("SCORE", marginX + 115, currentY + 4.2);
  doc.text("GRAPHICAL BENCHMARK", marginX + 138, currentY + 4.2);
  currentY += 6;

  criteriaItems.forEach((c) => {
    const rawVal = typeof c.score === "number" ? c.score : Number(c.score) || 0;
    const barWidth = Math.min(42, (rawVal / 10) * 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(c.label, marginX + 4, currentY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.text(`${rawVal.toFixed(1)} / 10`, marginX + 115, currentY + 4.5);

    // Track Background
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(marginX + 138, currentY + 2, 42, 3, 1, 1, "F");

    // Bar Fill
    let barColor = [37, 99, 235]; // Blue
    if (rawVal >= 8) barColor = [16, 185, 129]; // Green
    else if (rawVal < 6) barColor = [245, 158, 11]; // Amber
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.roundedRect(marginX + 138, currentY + 2, barWidth, 3, 1, 1, "F");

    // Divider
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY + 6.5, marginX + contentWidth, currentY + 6.5);

    currentY += 6.5;
  });

  currentY += 4;

  // 6. WHAT WENT WELL & WHAT NEEDS IMPROVEMENT (TWO-COLUMN BOXES)
  checkPageBreak(45);
  const colWidth = (contentWidth - 5) / 2;

  // Left Box: Strengths
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(marginX, currentY, colWidth, 42, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52); // Emerald 800
  doc.text("✓ WHAT YOU DID WELL", marginX + 4, currentY + 5.5);

  let leftY = currentY + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  evaluation.whatWentWell.forEach((w) => {
    const lines = doc.splitTextToSize(`• ${w}`, colWidth - 8);
    doc.text(lines, marginX + 4, leftY);
    leftY += lines.length * 3.6;
  });

  // Right Box: Needs Improvement
  const rightX = marginX + colWidth + 5;
  doc.setFillColor(254, 242, 242); // Rose 50
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(rightX, currentY, colWidth, 42, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(159, 18, 57); // Rose 800
  doc.text("⚠ AREAS NEEDING IMPROVEMENT", rightX + 4, currentY + 5.5);

  let rightY = currentY + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  evaluation.needsImprovement.forEach((n) => {
    const lines = doc.splitTextToSize(`• ${n}`, colWidth - 8);
    doc.text(lines, rightX + 4, rightY);
    rightY += lines.length * 3.6;
  });

  currentY += 46;

  // 7. HIGH-SCORING MISSING DIMENSIONS (THE 12+ MARKS FORMULA)
  checkPageBreak(30);
  doc.setFillColor(255, 251, 235); // Amber 50
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(marginX, currentY, contentWidth, 26, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text("★ CRITICAL MISSING DIMENSIONS FOR 12.5+ MARKS IN THE EXAM HALL", marginX + 4, currentY + 5.5);

  let missY = currentY + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  evaluation.missingDimensions.forEach((m) => {
    const lines = doc.splitTextToSize(`➤ ${m}`, contentWidth - 8);
    doc.text(lines, marginX + 4, missY);
    missY += lines.length * 3.8;
  });

  currentY += 30;

  // 8. BOLT'S ACADEMIC ASSESSMENT & GUIDANCE
  checkPageBreak(36);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, currentY, contentWidth, 32, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // Blue 900
  doc.text("⚡ BOLT'S PERSONAL ACADEMIC ASSESSMENT & WAY FORWARD", marginX + 4, currentY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const splitFeedback = doc.splitTextToSize(evaluation.boltFeedback, contentWidth - 8);
  doc.text(splitFeedback, marginX + 4, currentY + 11);

  currentY += 36;

  // 9. STUDENT ANSWER TRANSCRIPT (If provided)
  if (evaluation.studentAnswerText && evaluation.studentAnswerText.trim().length > 0) {
    checkPageBreak(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("ARCHIVED CANDIDATE ANSWER TRANSCRIPT", marginX, currentY);
    currentY += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const transcriptLines = doc.splitTextToSize(evaluation.studentAnswerText, contentWidth - 8);
    const transcriptBoxHeight = Math.min(60, transcriptLines.length * 3.8 + 8);

    doc.roundedRect(marginX, currentY, contentWidth, transcriptBoxHeight, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(transcriptLines.slice(0, 14), marginX + 4, currentY + 6);
    currentY += transcriptBoxHeight + 4;
  }

  // 10. FOOTER ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `BOLT UPSC • Academic Evaluation Dossier • Confidential & Personalized for ${candidateName}`,
      marginX,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: "right" });
  }

  // Handle Action
  const safeName = (evaluation.questionText || "mains-evaluation")
    .slice(0, 30)
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();

  if (options?.autoPrint) {
    doc.autoPrint();
  }
  doc.save(`bolt_mains_evaluation_${safeName}_${Date.now()}.pdf`);

  return doc;
}

/**
 * Export Model Answer as Formatted PDF Notes
 */
export function exportModelAnswerPDF(
  modelAnswer: MainsModelAnswer,
  options?: PDFExportOptions
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 14;

  const candidateName = options?.aspirantName || "UPSC Aspirant";

  const checkPageBreak = (neededHeight: number): void => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("BOLT UPSC - TOPPER-GRADE MAINS MODEL ANSWER", marginX, 10);
      doc.text(`PAPER: ${modelAnswer.paper.toUpperCase()}`, pageWidth - marginX, 10, { align: "right" });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, 12, pageWidth - marginX, 12);
    }
  };

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, currentY, contentWidth, 22, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("BOLT UPSC • TOPPER-GRADE MODEL ANSWER DOSSIER", marginX + 6, currentY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${modelAnswer.paper} • Year: ${modelAnswer.year} • Marks: ${modelAnswer.marks} • Directive: ${modelAnswer.directive}`,
    marginX + 6,
    currentY + 15
  );

  currentY += 26;

  // Question Box
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(marginX, currentY, contentWidth, 18, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  const qLines = doc.splitTextToSize(`"${modelAnswer.questionText}"`, contentWidth - 8);
  doc.text(qLines, marginX + 4, currentY + 6);
  currentY += 22;

  // Introduction
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("1. INTRODUCTION & CONTEXT", marginX, currentY);
  currentY += 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  const introLines = doc.splitTextToSize(modelAnswer.introduction, contentWidth - 8);
  const introHeight = introLines.length * 4 + 6;
  doc.roundedRect(marginX, currentY, contentWidth, introHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(introLines, marginX + 4, currentY + 5);
  currentY += introHeight + 4;

  // Concept Diagram Summary
  if (modelAnswer.diagramNodes && modelAnswer.diagramNodes.length > 0) {
    checkPageBreak(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`2. RAPID 45-SECOND EXAM HALL CONCEPT DIAGRAM (${modelAnswer.diagramTitle || "Concept Flow"})`, marginX, currentY);
    currentY += 4;

    const nodeWidth = (contentWidth - (modelAnswer.diagramNodes.length - 1) * 3) / modelAnswer.diagramNodes.length;
    modelAnswer.diagramNodes.forEach((node, idx) => {
      const nodeX = marginX + idx * (nodeWidth + 3);
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(nodeX, currentY, nodeWidth, 24, 1, 1, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(node.title, nodeX + 2, currentY + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      let pointY = currentY + 9;
      node.points.slice(0, 3).forEach((p) => {
        const pLine = doc.splitTextToSize(`• ${p}`, nodeWidth - 4);
        doc.text(pLine, nodeX + 2, pointY);
        pointY += pLine.length * 3;
      });
    });
    currentY += 28;
  }

  // Body Dimensions
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("3. MULTI-DIMENSIONAL ANALYSIS & EVIDENCE", marginX, currentY);
  currentY += 4;

  modelAnswer.bodySections.forEach((sec) => {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    doc.text(`▸ ${sec.title}`, marginX, currentY);
    currentY += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    sec.points.forEach((pt) => {
      const ptLines = doc.splitTextToSize(`• ${pt}`, contentWidth - 4);
      checkPageBreak(ptLines.length * 3.8 + 2);
      doc.text(ptLines, marginX + 2, currentY);
      currentY += ptLines.length * 3.8;
    });

    if (sec.examples) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      const exLines = doc.splitTextToSize(`Examples: ${sec.examples}`, contentWidth - 4);
      doc.text(exLines, marginX + 2, currentY);
      currentY += exLines.length * 3.6 + 2;
    }
    currentY += 2;
  });

  // Way Forward & Conclusion
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("4. PRAGMATIC WAY FORWARD & CONCLUSION", marginX, currentY);
  currentY += 4;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  const concLines = doc.splitTextToSize(modelAnswer.conclusion, contentWidth - 8);
  const concHeight = concLines.length * 4 + 8;
  doc.roundedRect(marginX, currentY, contentWidth, concHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text(concLines, marginX + 4, currentY + 5);
  currentY += concHeight + 4;

  // Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`BOLT UPSC • Topper Model Answer Dossier • For offline study and revision by ${candidateName}`, marginX, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: "right" });
  }

  const safeTopic = (modelAnswer.topic || "model_answer")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  doc.save(`bolt_model_answer_${safeTopic}_${Date.now()}.pdf`);

  return doc;
}
