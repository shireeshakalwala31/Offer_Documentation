const path = require("path");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const fs = require("fs");

const generateAppraisalPDF = async (data) => {
  try {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data provided to generateAppraisalPDF()");
    }

    // Template & Assets
    const templatePath = path.join(__dirname, "../templates/appraisal.ejs");
    const assetsDir = path.resolve(__dirname, "../assets");

    // Embed Logo
    const logoCandidates = [
      path.join(assetsDir, "logo.png"),
      path.join(assetsDir, "image.png"),
      path.join(assetsDir, "Amazon-Logo1.png"),
    ];

    const foundLogo = logoCandidates.find((p) => fs.existsSync(p));
    let logoPath = "";
    if (foundLogo) {
      const mime = foundLogo.endsWith(".png")
        ? "image/png"
        : foundLogo.endsWith(".jpg") || foundLogo.endsWith(".jpeg")
        ? "image/jpeg"
        : "application/octet-stream";

      logoPath = `data:${mime};base64,${fs.readFileSync(foundLogo).toString("base64")}`;
    }

    // Embed Letterhead
    const letterheadCandidates = [
      path.join(assetsDir, "letterhead.png"),
      path.join(assetsDir, "letterhead.jpg"),
      path.join(assetsDir, "letterhead.jpeg"),
    ];

    const foundLetterhead = letterheadCandidates.find((p) =>
      fs.existsSync(p)
    );

    let letterheadPath = "";
    if (foundLetterhead) {
      const mime = foundLetterhead.endsWith(".png")
        ? "image/png"
        : foundLetterhead.endsWith(".jpg") ||
          foundLetterhead.endsWith(".jpeg")
        ? "image/jpeg"
        : "application/octet-stream";

      letterheadPath = `data:${mime};base64,${fs.readFileSync(
        foundLetterhead
      ).toString("base64")}`;
    }
    // Embed Signature
const signatureCandidates = [
  path.join(assetsDir, "signature.png"),
  path.join(assetsDir, "sign.png"),
  path.join(assetsDir, "signature.jpg")
];

const foundSignature = signatureCandidates.find((p) => fs.existsSync(p));
let signaturePath = "";

if (foundSignature) {
  const mime = foundSignature.endsWith(".png")
    ? "image/png"
    : foundSignature.endsWith(".jpg") || foundSignature.endsWith(".jpeg")
    ? "image/jpeg"
    : "application/octet-stream";

  signaturePath = `data:${mime};base64,${fs.readFileSync(foundSignature).toString("base64")}`;
}


    // Render HTML From EJS
    const html = await ejs.renderFile(templatePath, {
      employee_name: data.employeeName || "Employee Name",
      employee_id: data.employeeId || "EMP001",
      joining_date: data.dateOfJoining,
      new_salary: data.newSalary,
      salary_in_words: data.salaryInWords,
      promoted_role: data.promotedRole,
      issue_date: data.issueDate,
      hrName: data.hrName || "Chakravarthy Devarkonda",
      hrDesignation: data.hrDesignation || "Manager – Human Resources",
      companyName: data.companyName || "Amazon IT Solutions",
      logoPath,
      letterheadPath,
      signaturePath 
    });

    // Inject Letterhead Background
    let modifiedHtml = html;
    if (letterheadPath) {
      modifiedHtml = modifiedHtml.replace(
        "<body>",
        `<body>
          <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            background-image: url('${letterheadPath}');
            background-repeat: no-repeat;
            background-size: 100% 100%;
            background-position: top left;
            z-index: -1;">
          </div>`
      );
    }

    // Add custom CSS overrides for margin layout
    const cssParts = [
      ".container { padding-top: 40mm !important; padding-left: 22mm !important; padding-right: 22mm !important; padding-bottom: 22mm !important; }",
      ".title { margin-top: 10mm !important; }",
    ];
    const finalHtml = modifiedHtml.replace(
      "</style>",
      cssParts.join("\n") + "\n</style>"
    );

    // Puppeteer PDF Generation
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      executablePath: puppeteer.executablePath(),
    });

    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });
    await page.evaluateHandle("document.fonts.ready");

    // Output Directory
    const uploadsDir = path.resolve(__dirname, "../generated_pdfs");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const safeName = (data.employeeName || "Employee").replace(/\s+/g, "_");
    const companySafe = (data.companyName || "Amazon IT Solutions")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");
    const pdfPath = path.join(
      uploadsDir,
      `Appraisal_Letter_${safeName}_${companySafe}.pdf`
    );

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "15mm", bottom: "15mm", left: "10mm", right: "10mm" },
    });

    await browser.close();
    return pdfPath;
  } catch (error) {
    throw error;
  }
};

module.exports = generateAppraisalPDF;



