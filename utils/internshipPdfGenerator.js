const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const logger = require("../logger/logger");

// ✅ Generate Internship Offer PDF
const generateInternshipPDF = async (internshipData) => {
  try {
    if (!internshipData || typeof internshipData !== "object") {
      throw new Error("Invalid internship offer data provided to generateInternshipPDF()");
    }

    const templatePath = path.join(__dirname, "../templates/internshipOffer.ejs");
    const assetsDir = path.resolve(__dirname, "../assets");

    // Resolve asset paths
    const logoPath = path.join(assetsDir, "letterhead.jpeg");
    const signaturePath = path.join(assetsDir, "signature.jpg");

    // Check if assets exist
    const logoExists = fs.existsSync(logoPath);
    const signatureExists = fs.existsSync(signaturePath);

    const html = await ejs.renderFile(templatePath, {
      candidateName: internshipData.candidateName || "Candidate",
      candidateEmail: internshipData.candidateEmail || "",
      candidatePhone: internshipData.candidatePhone || "",
      candidateAddress: internshipData.candidateAddress || "Address Not Provided",
      position: internshipData.position || "Intern",
      internshipDuration: internshipData.internshipDuration || "6 Months",
      startDate: internshipData.startDate || new Date(),
      endDate: internshipData.endDate || "",
      workLocation: internshipData.workLocation || "Work From Office",
      firstPhaseStipend: internshipData.firstPhaseStipend || 6000,
      firstPhaseDuration: internshipData.firstPhaseDuration || "3 Months",
      secondPhaseStipend: internshipData.secondPhaseStipend || 10000,
      secondPhaseDuration: internshipData.secondPhaseDuration || "3 Months",
      firstPhaseStipendInWords: internshipData.firstPhaseStipendInWords || "Six Thousand",
      secondPhaseStipendInWords: internshipData.secondPhaseStipendInWords || "Ten Thousand",
      dateIssued: internshipData.dateIssued || new Date(),
      companyName: internshipData.companyName || "Amazon IT Solutions",
      companyAddress: internshipData.companyAddress || "Hyderabad",
      referenceNumber: internshipData.referenceNumber || "",
      logoPath: logoExists ? `file://${logoPath}` : "",
      signaturePath: signatureExists ? `file://${signaturePath}` : "",
    });

    // Create uploads directory if not exists
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Use Puppeteer to generate PDF (similar to existing implementation)
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const companySafe = (internshipData.companyName || "Amazon_IT_Solutions")
      .replace(/\s+/g, "_");
    const safeName = (internshipData.candidateName || "Candidate").replace(/\s+/g, "_");

    const pdfPath = path.join(
      uploadsDir,
      `InternshipOffer_${safeName}_${companySafe}.pdf`
    );

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    await browser.close();
    logger.info("Internship Offer PDF generated at:", pdfPath);
    return pdfPath;
  } catch (error) {
    logger.error("❌ Error generating Internship Offer PDF: " + error.stack);
    throw error;
  }
};

module.exports = generateInternshipPDF;
