import PDFDocument from "pdfkit";

const mm = 2.834646;
const fontPath = {
  "Times-Roman": "./dist/fonts/times.ttf",
  "Times-Bold": "./dist/fonts/timesbd.ttf",
};

export async function pdfGenerate(words: string[]) {
  const doc = new PDFDocument({
    size: "A4",
    bufferPages: true,
    margins: {
      left: 20 * mm,
      right: 5 * mm,
      bottom: 15 * mm,
      top: 5 * mm,
    },
  });
  doc.font(fontPath["Times-Bold"]);
  doc.text("Слова найденные на странице", { align: "center" });
  doc.font(fontPath["Times-Roman"]);
  for (const word of words) {
    doc.text(word);
  }
  doc.end();
  return doc;
}
