/**
 * EduMorph 108 - Professional Word (.docx) Document Generator
 * Generates standardized exam papers conforming to Taiwan Senior High School Exam Layouts.
 * Supports:
 *  - Student Exam Paper (Form A)
 *  - Student Parallel Exam Paper (Form B)
 *  - Teacher Detailed Solution & Rubric Paper
 */

const ExamDocxExporter = (function () {

  /**
   * Helper function to build docx headers and metadata table
   */
  function createExamHeader(examTitle, subjectName, formType, isTeacherEdition = false) {
    const { Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } = docx;

    const noBorder = {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    };

    const lightBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
    };

    const paragraphs = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: "國立示範高級中學 113學年度 第一學期 素養評量測驗",
            font: "標楷體",
            size: 24, // 12pt
            color: "333333",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `${examTitle}【${subjectName}科】 (${formType})`,
            font: "微軟正黑體",
            bold: true,
            size: 32, // 16pt
            color: isTeacherEdition ? "B91C1C" : "1E293B",
          }),
          ...(isTeacherEdition ? [
            new TextRun({
              text: " ［教師專用・含詳解評分規準］",
              font: "微軟正黑體",
              bold: true,
              size: 24,
              color: "B91C1C"
            })
          ] : [])
        ],
      }),
    ];

    // Info table: 班級, 座號, 姓名, 得分 (學生卷) 或 科目與命題資訊 (教師卷)
    let infoTable;
    if (!isTeacherEdition) {
      infoTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: lightBorder,
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: [new Paragraph({
                  children: [new TextRun({ text: " 班級：____________", font: "標楷體", size: 22 })]
                })],
              }),
              new TableCell({
                borders: lightBorder,
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: [new Paragraph({
                  children: [new TextRun({ text: " 座號：________", font: "標楷體", size: 22 })]
                })],
              }),
              new TableCell({
                borders: lightBorder,
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [new Paragraph({
                  children: [new TextRun({ text: " 姓名：____________", font: "標楷體", size: 22 })]
                })],
              }),
              new TableCell({
                borders: lightBorder,
                width: { size: 20, type: WidthType.PERCENTAGE },
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "得分：      ", font: "標楷體", bold: true, size: 22 })]
                })],
              }),
            ],
          }),
        ],
      });
    } else {
      infoTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: lightBorder,
                width: { size: 40, type: WidthType.PERCENTAGE },
                children: [new Paragraph({
                  children: [new TextRun({ text: ` 命題領域：${subjectName}`, font: "微軟正黑體", size: 20 })]
                })],
              }),
              new TableCell({
                borders: lightBorder,
                width: { size: 35, type: WidthType.PERCENTAGE },
                children: [new Paragraph({
                  children: [new TextRun({ text: " 命題系統：EduMorph 108 AI", font: "微軟正黑體", size: 20 })]
                })],
              }),
              new TableCell({
                borders: lightBorder,
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: [new Paragraph({
                  children: [new TextRun({ text: ` 試卷版本：${formType}`, font: "微軟正黑體", bold: true, size: 20 })]
                })],
              }),
            ],
          }),
        ],
      });
    }

    return [...paragraphs, infoTable, new Paragraph({ spacing: { after: 200 } })];
  }

  /**
   * Cleans text from markdown formulas (e.g. $x$ or \frac{a}{b}) into legible text in Word
   */
  function cleanFormulaForDocx(text) {
    if (!text) return "";
    return text
      .replace(/\$\$(.*?)\$\$/g, "$1")
      .replace(/\$(.*?)\$/g, "$1")
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\le/g, "≤")
      .replace(/\\ge/g, "≥")
      .replace(/\\ne/g, "≠")
      .replace(/\\pm/g, "±")
      .replace(/\\approx/g, "≈")
      .replace(/\\pi/g, "π")
      .replace(/\\theta/g, "θ")
      .replace(/\\degree/g, "°")
      .replace(/\\circ/g, "°")
      .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
      .replace(/\\mathbf\{([^}]+)\}/g, "$1")
      .replace(/\\text\{([^}]+)\}/g, "$1");
  }

  /**
   * Main export method
   * @param {Object} questionData Question JSON
   * @param {String} mode 'student_a' | 'student_b' | 'teacher'
   */
  async function exportToWord(questionData, mode = 'student_a') {
    if (!window.docx) {
      alert("無法載入 docx.js 模組，請檢查網路連線。");
      return;
    }

    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } = docx;

    const isTeacher = mode === 'teacher';
    const isFormB = mode === 'student_b';
    const formLabel = isFormB ? "B 卷 (平行測驗卷)" : "A 卷 (標準測驗卷)";
    const subjectName = questionData.subjectName || "素養評量";

    const docChildren = [];

    // 1. Add Exam Header
    const headerNodes = createExamHeader("108課綱素養能力定期評量", subjectName, formLabel, isTeacher);
    docChildren.push(...headerNodes);

    // 2. Exam Section Title
    const typeLabel = questionData.targetType === 'multiple_choice' ? '壹、單選題' :
                      questionData.targetType === 'multi_select' ? '壹、多選題' :
                      questionData.targetType === 'fill_in' ? '壹、填充題' : '壹、綜合計算與問答題';

    docChildren.push(
      new Paragraph({
        spacing: { before: 150, after: 150 },
        children: [
          new TextRun({
            text: `${typeLabel}（每題 ${questionData.score || 5} 分，共 ${questionData.score || 5} 分）`,
            font: "微軟正黑體",
            bold: true,
            size: 22,
          }),
        ],
      })
    );

    // 3. Question Item Body
    // Clean LaTeX formulas for clear Word display
    const cleanedStem = cleanFormulaForDocx(questionData.stem || "");

    docChildren.push(
      new Paragraph({
        spacing: { before: 100, after: 120 },
        children: [
          new TextRun({
            text: `1. `,
            font: "Times New Roman",
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: cleanedStem,
            font: "標楷體",
            size: 22,
          }),
        ],
      })
    );

    // 4. Options or Blank Space based on Question Type
    if (questionData.targetType === 'multiple_choice' || questionData.targetType === 'multi_select') {
      const options = questionData.options || [];
      // Arrange options: 2 columns or 4 rows
      for (const opt of options) {
        docChildren.push(
          new Paragraph({
            indent: { left: 400 },
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: `${opt.key}. `,
                font: "Times New Roman",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: cleanFormulaForDocx(opt.text),
                font: "標楷體",
                size: 22,
              }),
            ],
          })
        );
      }
    } else if (questionData.targetType === 'fill_in') {
      docChildren.push(
        new Paragraph({
          indent: { left: 400 },
          spacing: { before: 150, after: 150 },
          children: [
            new TextRun({
              text: "答：______________________________________",
              font: "微軟正黑體",
              bold: true,
              size: 22,
            }),
          ],
        })
      );
    } else if (questionData.targetType === 'comprehensive') {
      // Add workspace box for student
      if (!isTeacher) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 100, after: 80 },
            children: [
              new TextRun({
                text: "【計算與作答區（請列出必要計算式與單位）：】",
                font: "微軟正黑體",
                size: 20,
                color: "666666",
              }),
            ],
          })
        );

        // Workspace Box
        const borderBox = {
          top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        };
        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                height: { value: 2400, rule: "atleast" }, // large box
                children: [
                  new TableCell({
                    borders: borderBox,
                    children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
                  }),
                ],
              }),
            ],
          })
        );
      }
    }

    // 5. If Teacher Edition: Append Answers, Step-by-Step Rubrics, and 108 Competency Index
    if (isTeacher) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 300, after: 100 },
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              color: "B91C1C",
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [
            new TextRun({
              text: "【參考標準答案】： ",
              font: "微軟正黑體",
              bold: true,
              size: 22,
              color: "B91C1C",
            }),
            new TextRun({
              text: cleanFormulaForDocx(questionData.correctAnswer || "詳見解題過程"),
              font: "微軟正黑體",
              bold: true,
              size: 24,
              color: "047857",
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 100, after: 80 },
          children: [
            new TextRun({
              text: "【步驟詳解與給分規準 (Rubrics)】：",
              font: "微軟正黑體",
              bold: true,
              size: 22,
              color: "1E293B",
            }),
          ],
        })
      );

      // Detailed Steps
      const steps = questionData.solutionSteps || [];
      steps.forEach((step, idx) => {
        docChildren.push(
          new Paragraph({
            indent: { left: 300 },
            spacing: { before: 50, after: 50 },
            children: [
              new TextRun({
                text: `第 (${idx + 1}) 步：`,
                font: "微軟正黑體",
                bold: true,
                size: 20,
                color: "4F46E5",
              }),
              new TextRun({
                text: cleanFormulaForDocx(step),
                font: "微軟正黑體",
                size: 20,
              }),
            ],
          })
        );
      });

      // Distractor diagnosis for multiple choice
      if (questionData.distractorAnalysis && questionData.distractorAnalysis.length > 0) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 150, after: 80 },
            children: [
              new TextRun({
                text: "【誘答項設計與學生迷思診斷】：",
                font: "微軟正黑體",
                bold: true,
                size: 22,
                color: "1E293B",
              }),
            ],
          })
        );

        questionData.distractorAnalysis.forEach((analysis) => {
          docChildren.push(
            new Paragraph({
              indent: { left: 300 },
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: `• ${cleanFormulaForDocx(analysis)}`,
                  font: "微軟正黑體",
                  size: 19,
                  color: "4B5563",
                }),
              ],
            })
          );
        });
      }

      // 108 Curriculum Alignment
      docChildren.push(
        new Paragraph({
          spacing: { before: 150, after: 80 },
          children: [
            new TextRun({
              text: "【108課綱核心素養與學習評量向度】：",
              font: "微軟正黑體",
              bold: true,
              size: 22,
              color: "1E293B",
            }),
          ],
        }),
        new Paragraph({
          indent: { left: 300 },
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: `• 核心素養面向：${questionData.competency || "A 自主行動（A2系統思考與問題解決）、B 溝通互動（B1符號運用與溝通表達）"}`,
              font: "微軟正黑體",
              size: 19,
            }),
          ],
        }),
        new Paragraph({
          indent: { left: 300 },
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: `• 難易度階層（Bloom Taxonomy）：${questionData.bloomLevel || "理解 / 應用層次（難度與原題等價）"}`,
              font: "微軟正黑體",
              size: 19,
            }),
          ],
        })
      );
    }

    // 6. Build the Docx document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch = 1440 twips
                bottom: 1440,
                left: 1440,
                right: 1440,
              },
            },
          },
          children: docChildren,
        },
      ],
    });

    // 7. Trigger download via FileSaver
    const blob = await Packer.toBlob(doc);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = isTeacher 
      ? `EduMorph108_教師詳解卷_${subjectName}_${dateStr}.docx`
      : isFormB 
      ? `EduMorph108_學生測驗卷_B卷_${subjectName}_${dateStr}.docx`
      : `EduMorph108_學生測驗卷_A卷_${subjectName}_${dateStr}.docx`;

    saveAs(blob, fileName);
  }

  return {
    exportToWord: exportToWord,
    cleanFormula: cleanFormulaForDocx
  };
})();
