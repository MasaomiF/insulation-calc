/**
 * DOM ノードを A4 PDF に分割して保存（縦長は複数ページ）。
 * html2canvas / jsPDF は初回呼び出し時のみ読み込み。
 * @param {HTMLElement} element
 * @param {string} suggestedBaseName 拡張子なし（ファイル名に使う）
 */
export async function exportInsulationReportPdf(element, suggestedBaseName = "report") {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const contentW = pageW - 2 * margin;
  const contentH = pageH - 2 * margin;
  const imgW = contentW;
  const imgH = (canvas.height * imgW) / canvas.width;

  let heightLeft = imgH;
  let y = margin;

  pdf.addImage(imgData, "JPEG", margin, y, imgW, imgH);
  heightLeft -= contentH;

  while (heightLeft > 0.5) {
    y = margin - (imgH - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, y, imgW, imgH);
    heightLeft -= contentH;
  }

  const safe = String(suggestedBaseName || "report").replace(/[/\\?%*:|"<>]/g, "-").trim() || "report";
  pdf.save(`${safe}_断熱荷重レポート.pdf`);
}
