import express from "express";
import path from "path";
import fs from "fs";
import { google } from "googleapis";
import dotenv from "dotenv";
import https from "https";

import { GoogleGenAI } from "@google/genai";
import multer from "multer";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();


const app = express();
const PORT = 3000;

// Set up local uploads directory
const UPLOADS_DIR = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error("Error creating uploads directory:", err);
  }
}


// Serve uploads statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("รองรับเฉพาะไฟล์รูปภาพเท่านั้น"));
    }
  },
});

// Set up middleware
app.use(express.json());

// Initialize Gemini client if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("Gemini AI Client initialized successfully.");


  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
}

// Set up Fallback Database Path
const DB_FALLBACK_FILE = process.env.VERCEL
  ? path.join("/tmp", "db-fallback.json")
  : path.join(process.cwd(), "db-fallback.json");

// Default initial data for PEA District 1 Manager's Club (กฟฉ.1)
const DEFAULT_DATABASE = {
  news: [
    {
      id: "news-1",
      title: "ชมรมผู้จัดการ กฟฉ.1 จัดกิจกรรมบริจาคโลหิตเฉลิมพระเกียรติฯ ร่วมกับ รพ.ศูนย์อุดรธานี",
      content: "เมื่อวันที่ 5 กรกฎาคม 2569 ชมรมผู้จัดการการไฟฟ้าส่วนภูมิภาค เขต 1 (ภาคตะวันออกเฉียงเหนือ) จังหวัดอุดรธานี นำโดยประธานชมรมและคณะผู้จัดการการไฟฟ้าในสังกัด ได้ร่วมกันจัดกิจกรรมบริจาคโลหิตเพื่อสำรองเข้าคลังเลือดสำหรับช่วยเหลือผู้ป่วยฉุกเฉิน ณ สำนักงาน กฟฉ.1 จังหวัดอุดรธานี โดยมียอดผู้ร่วมบริจาครวมกว่า 120,000 ซีซี ซึ่งจะส่งมอบให้กับโรงพยาบาลศูนย์อุดรธานีต่อไป ขอขอบคุณผู้จัดการและพนักงานทุกท่านที่ร่วมสร้างกุศลอันยิ่งใหญ่ในครั้งนี้",
      date: "2026-07-05",
      imageUrl: "https://images.unsplash.com/photo-1615461066841-6116ecdccd04?auto=format&fit=crop&q=80&w=800",
      category: "กิจกรรมชมรม",
      author: "ประชาสัมพันธ์ กฟฉ.1"
    },
    {
      id: "news-2",
      title: "การประชุมสามัญประจำปีชมรมผู้จัดการ กฟฉ.1 ประจำปี 2569 กำหนดมาตรการเสริมความมั่นคงระบบไฟฟ้า",
      content: "ชมรมผู้จัดการ กฟฉ.1 จัดการประชุมสามัญประจำปีเพื่อรายงานผลการดำเนินงานในรอบปีที่ผ่านมา และหารือทิศทางการดำเนินงานเพื่อเตรียมความพร้อมรับมือภัยพิบัติและช่วงฤดูฝน โดยที่ประชุมได้เน้นย้ำแนวทางการซ่อมบำรุงเชิงป้องกัน (Preventive Maintenance) และการบูรณาการระบบโครงข่ายอัจฉริยะ (Smart Grid) ในพื้นที่รับผิดชอบของ 7 จังหวัดอีสานตอนบน รวมถึงมาตรการช่วยเหลือผู้ใช้ไฟฟ้าที่ได้รับผลกระทบจากพายุฤดูร้อนอย่างเร่งด่วน ณ ห้องประชุมชั้น 3 สำนักงานการไฟฟ้าส่วนภูมิภาค เขต 1 อุดรธานี",
      date: "2026-06-28",
      imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
      category: "ข่าวสารทั่วไป",
      author: "เลขานุการชมรม"
    },
    {
      id: "news-3",
      title: "ชมรมผู้จัดการ กฟฉ.1 ลงพื้นที่ฟื้นฟูระบบไฟฟ้าหลังน้ำลด ช่วยเหลือผู้ประสบภัยในจังหวัดหนองคาย",
      content: "จากสถานการณ์น้ำท่วมฉับพลันในลุ่มน้ำโขงที่ส่งผลกระทบในพื้นที่หนองคายและบึงกาฬ ชมรมผู้จัดการ กฟฉ.1 ได้จัดตั้งทีมเฉพาะกิจระดมเครื่องมือ ยานพาหนะ และพนักงานช่าง เดินทางเข้าตรวจสอบ ซ่อมแซม และเปลี่ยนอุปกรณ์ตัดตอนระบบไฟฟ้าที่เสียหายให้กับบ้านเรือนประชาชนฟรี โดยไม่มีค่าใช้จ่าย เพื่อให้ประชาชนสามารถกลับมาใช้กระแสไฟฟ้าได้อย่างปลอดภัยสูงสุด พร้อมทั้งมอบถุงยังชีพจำนวน 500 ชุดให้กับครอบครัวผู้ประสบอุทกภัยในพื้นที่ตำบลเวียงคุก อ.เมือง จ.หนองคาย",
      date: "2026-06-15",
      imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800",
      category: "กิจกรรมชมรม",
      author: "ฝ่ายพัฒนาสังคมและ CSR"
    }
  ],
  members: [
    {
      id: "mem-1",
      name: "นายสมภพ วรเดช",
      position: "ผู้จัดการการไฟฟ้าส่วนภูมิภาคจังหวัดอุดรธานี",
      peaOffice: "กฟจ.อุดรธานี",
      email: "somphop.wor@pea.co.th",
      phone: "081-234-5678",
      status: "Active",
      role: "ประธานชมรม"
    },
    {
      id: "mem-2",
      name: "นายวีระพล ชัยสิทธิ์",
      position: "ผู้จัดการการไฟฟ้าส่วนภูมิภาคอำเภอกุมภวาปี",
      peaOffice: "กฟส.กุมภวาปี",
      email: "weeraphon.cha@pea.co.th",
      phone: "089-876-5432",
      status: "Active",
      role: "เลขานุการชมรม"
    },
    {
      id: "mem-3",
      name: "นางสาวมนัสวี สุขเกษม",
      position: "ผู้จัดการการไฟฟ้าส่วนภูมิภาคอำเภอหนองหาน",
      peaOffice: "กฟส.หนองหาน",
      email: "manaswee.suk@pea.co.th",
      phone: "085-555-1234",
      status: "Active",
      role: "เหรัญญิกชมรม"
    },
    {
      id: "mem-4",
      name: "นายประยุกต์ พัธโนทัย",
      position: "ผู้จัดการการไฟฟ้าส่วนภูมิภาคจังหวัดเลย",
      peaOffice: "กฟจ.เลย",
      email: "prayut.pat@pea.co.th",
      phone: "084-777-8899",
      status: "Active",
      role: "กรรมการ"
    },
    {
      id: "mem-5",
      name: "นายชินภัทร ธนสาร",
      position: "ผู้จัดการการไฟฟ้าส่วนภูมิภาคจังหวัดหนองคาย",
      peaOffice: "กฟจ.หนองคาย",
      email: "chinapat.tan@pea.co.th",
      phone: "086-444-5555",
      status: "Active",
      role: "กรรมการ"
    },
    {
      id: "mem-6",
      name: "นายเอกสิทธิ์ มีสุข",
      position: "ผู้จัดการการไฟฟ้าส่วนภูมิภาคอำเภอศรีเชียงใหม่",
      peaOffice: "กฟส.ศรีเชียงใหม่",
      email: "ekkasit.mee@pea.co.th",
      phone: "087-999-0000",
      status: "Active",
      role: "สมาชิก"
    },
    {
      id: "mem-7",
      name: "นายธีระพงษ์ แก้วดี",
      position: "ผู้จัดการการไฟฟ้าส่วนภูมิภาคจังหวัดบึงกาฬ",
      peaOffice: "กฟจ.บึงกาฬ",
      email: "theerapong.kae@pea.co.th",
      phone: "082-111-2222",
      status: "Active",
      role: "สมาชิก"
    }
  ],
  calendar: [
    {
      id: "cal-1",
      title: "ประชุมคณะกรรมการชมรมผู้จัดการ กฟฉ.1 ครั้งที่ 2/2569",
      description: "หารือมาตรการความปลอดภัยเครือข่ายไฟฟ้าช่วงมรสุม และสรุปงบการจัดกิจกรรมกีฬาภายในของชมรม",
      date: "2026-07-15",
      time: "09:30",
      location: "ห้องประชุมกัลปพฤกษ์ ชั้น 4 สำนักงาน กฟฉ.1 อุดรธานี",
      category: "ประชุม"
    },
    {
      id: "cal-2",
      title: "กิจกรรม CSR มอบทุนการศึกษาและปรับปรุงระบบไฟฟ้าโรงเรียน",
      description: "ดำเนินกิจกรรมเปลี่ยนหลอดไฟ LED, ตรวจสอบสายดิน และตู้ควบคุมไฟฟ้า พร้อมมอบพัดลมและอุปกรณ์กีฬาให้กับนักเรียน",
      date: "2026-08-05",
      time: "08:30",
      location: "โรงเรียนบ้านดงอุดม อ.เมือง จ.อุดรธานี",
      category: "CSR"
    },
    {
      id: "cal-3",
      title: "การแข่งขันกีฬาฟุตซอลกระชับมิตร 'กฟฉ.1 สามัคคีคัพ'",
      description: "จัดกิจกรรมแข่งขันกีฬาระหว่างทีมผู้จัดการและทีมพนักงาน เพื่อสร้างความสัมพันธ์อันดีภายในหน่วยงาน",
      date: "2026-08-20",
      time: "15:00",
      location: "สนามกีฬาสนามหญ้าเทียมอุดรธานีฟุตซอลคลับ",
      category: "กิจกรรม"
    }
  ],
  regulations: [
    {
      id: "reg-1",
      title: "ระเบียบการเบิกจ่ายงบประมาณชมรม ปี 2569",
      content: "อ้างอิงจากมติที่ประชุมสามัญครั้งที่ 1/2569 การเบิกจ่ายงบประมาณเพื่อกิจกรรม CSR ต้องมีการเสนอโครงการให้คณะกรรมการพิจารณาอนุมัติก่อน",
      date: "2026-06-01",
      pdfUrl: ""
    }
  ],
  messages: [
    {
      id: "msg-1",
      senderName: "นายสมภพ วรเดช",
      senderPosition: "ประธานชมรมฯ",
      message: "ยินดีต้อนรับสมาชิกชมรมผู้จัดการ กฟฉ.1 ทุกท่าน เข้าสู่ระบบสื่อสารภายในที่มีความปลอดภัยครับ ช่องทางนี้จะถูกจำกัดเฉพาะสมาชิกของชมรมเราเท่านั้น ขอให้ทุกท่านใช้ในการปรึกษาหารือและประสานงานด่วนครับ",
      timestamp: "2026-07-07T09:00:00.000Z"
    },
    {
      id: "msg-2",
      senderName: "นายวีระพล ชัยสิทธิ์",
      senderPosition: "เลขานุการชมรมฯ",
      message: "ขออนุญาตเตือนเรื่องวันเข้าประชุมคณะกรรมการชมรมฯ ในวันที่ 15 กรกฎาคม นี้ครับ รบกวนผู้จัดการทุกท่านจัดเตรียมวาระการประชุมที่ต้องการเสนอส่งเข้ามายังระบบภายในนี้ล่วงหน้าด้วยนะครับ",
      timestamp: "2026-07-07T10:15:00.000Z"
    },
    {
      id: "msg-3",
      senderName: "นางสาวมนัสวี สุขเกษม",
      senderPosition: "เหรัญญิกชมรมฯ",
      message: "รับทราบค่ะ ทางฝ่ายบัญชีชมรมได้จัดเตรียมเล่มรายงานงบประมาณรายรับ-รายจ่าย ประจำไตรมาสที่ 2 เสร็จสมบูรณ์แล้ว พร้อมที่จะแจกจ่ายและแถลงให้ที่ประชุมทราบค่ะ",
      timestamp: "2026-07-07T11:30:00.000Z"
    }
  ]
};

// Initialize Local Fallback JSON Database if not exists
if (!fs.existsSync(DB_FALLBACK_FILE)) {
  try {
    const templatePath = path.join(process.cwd(), "db-fallback.json");
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, DB_FALLBACK_FILE);
    } else {
      fs.writeFileSync(DB_FALLBACK_FILE, JSON.stringify(DEFAULT_DATABASE, null, 2), "utf-8");
    }
    console.log("Local fallback JSON database seeded successfully.");
  } catch (err) {
    console.error("Error seeding local fallback JSON database:", err);
  }
}


// Read database from local fallback
function readLocalDB(): typeof DEFAULT_DATABASE {
  try {
    if (fs.existsSync(DB_FALLBACK_FILE)) {
      const data = fs.readFileSync(DB_FALLBACK_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading local database, resetting to default:", error);
  }
  return DEFAULT_DATABASE;
}

// Write database to local fallback
function writeLocalDB(data: typeof DEFAULT_DATABASE) {
  try {
    fs.writeFileSync(DB_FALLBACK_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to local database:", error);
  }
}

// Google Sheets Credentials config and setup
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "1jasuj5gEWPDF2AlrG2II-hTui5WRxlB5xPE6l9eqcuM";
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "1dqeZ6Cxr9uy2VmdPjk9twK0j3WU_Udqx";
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "กฟฉ1admin";
const MEMBER_PASSCODE = process.env.MEMBER_PASSCODE || "กฟฉ1member";

// Caching Layer Setup
interface CacheStore {
  data: any | null;
  lastUpdated: number;
}
const cache: { [key: string]: CacheStore } = {
  news: { data: null, lastUpdated: 0 },
  members: { data: null, lastUpdated: 0 },
  calendar: { data: null, lastUpdated: 0 },
  messages: { data: null, lastUpdated: 0 },
  regulations: { data: null, lastUpdated: 0 },
};
const CACHE_TTL = 30000; // 30 seconds caching to optimize Google Sheets API quota limits

// Retry mechanism for API robustness (Exponential Backoff)
async function executeWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0 || (error.status !== 429 && error.status !== 503)) {
      throw error;
    }
    console.warn(`Google API rate-limited (429) or unavailable (503). Retrying in ${delay}ms... (${retries} attempts left)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return executeWithRetry(fn, retries - 1, delay * 2);
  }
}

// Initialize Google APIs Sheets & Drive client
let googleSheetsClient: any = null;
let googleDriveClient: any = null;

function getGoogleAuth() {
  let email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  if (email && email.startsWith('"') && email.endsWith('"')) {
    email = email.slice(1, -1);
  }

  let privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (privateKeyRaw && privateKeyRaw.startsWith('"') && privateKeyRaw.endsWith('"')) {
    privateKeyRaw = privateKeyRaw.slice(1, -1);
  } else if (privateKeyRaw && privateKeyRaw.startsWith("'") && privateKeyRaw.endsWith("'")) {
    privateKeyRaw = privateKeyRaw.slice(1, -1);
  }

  if (!email || !privateKeyRaw) {
    return null;
  }

  try {
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n").trim();
    
    // Check if the private key contains valid PEM headers. If it doesn't, skip JWT creation
    // to prevent crypto DECODER routines::unsupported errors at runtime.
    if (!privateKey.includes("-----BEGIN") || !privateKey.includes("-----END")) {
      console.warn("GOOGLE_PRIVATE_KEY is not in a valid PEM format. Connection to Google APIs will be skipped, and local database fallback will be used.");
      return null;
    }

    return new google.auth.JWT({
      email,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive"
      ],
    });
  } catch (error) {
    console.error("Error creating Google JWT auth:", error);
    return null;
  }
}

function getGoogleSheets() {
  if (googleSheetsClient) return googleSheetsClient;
  const auth = getGoogleAuth();
  if (auth) {
    googleSheetsClient = google.sheets({ version: "v4", auth });
    return googleSheetsClient;
  }
  return null;
}

function getGoogleDrive() {
  if (googleDriveClient) return googleDriveClient;
  const auth = getGoogleAuth();
  if (auth) {
    googleDriveClient = google.drive({ version: "v3", auth });
    return googleDriveClient;
  }
  return null;
}

// Check and Initialize Google Sheets worksheets & header structures automatically if they don't exist
async function ensureGoogleSheetsStructure() {
  const sheets = getGoogleSheets();
  if (!sheets) {
    console.log("Skipping Google Sheets initialization: Service account credentials not configured in environment.");
    return;
  }

  try {
    // Read spreadsheet details
    const res: any = await executeWithRetry(() =>
      sheets.spreadsheets.get({
        spreadsheetId: GOOGLE_SHEET_ID,
      })
    );

    const sheetsMetadata = res.data.sheets || [];
    const existingTitles = sheetsMetadata.map((s: any) => s.properties.title);
    console.log("Connected to Google Sheets. Existing sheets:", existingTitles);

    const requiredSheets = [
      { name: "News", headers: ["id", "title", "content", "date", "imageUrl", "category", "author", "images"] },
      { name: "Members", headers: ["id", "name", "position", "peaOffice", "email", "phone", "status", "role", "imageUrl"] },
      { name: "Calendar", headers: ["id", "title", "description", "date", "time", "location", "category"] },
      { name: "Messages", headers: ["id", "senderName", "senderPosition", "message", "timestamp"] },
      { name: "Regulations", headers: ["id", "title", "content", "date", "pdfUrl", "images"] },
    ];

    const sheetsToCreate = requiredSheets.filter((rs) => !existingTitles.includes(rs.name));

    if (sheetsToCreate.length > 0) {
      console.log(`Creating missing sheets: ${sheetsToCreate.map((s) => s.name).join(", ")}`);
      
      const requests = sheetsToCreate.map((s) => ({
        addSheet: {
          properties: { title: s.name },
        },
      }));

      await executeWithRetry(() =>
        sheets.spreadsheets.batchUpdate({
          spreadsheetId: GOOGLE_SHEET_ID,
          requestBody: { requests },
        })
      );
    }

    // Populate headers and default data if they are newly created/empty
    const localDb = readLocalDB();
    for (const sheetConfig of requiredSheets) {
      const checkRes: any = await executeWithRetry(() =>
        sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: `${sheetConfig.name}!A1:Z2`,
        })
      );

      const rows = checkRes.data.values || [];
      if (rows.length === 0) {
        console.log(`Populating headers and initial values for sheet: ${sheetConfig.name}`);
        
        // Prepare rows: Headers row + local fallback items as initial data
        const headers = sheetConfig.headers;
        const initialRows = [headers];

        const key = sheetConfig.name.toLowerCase() as keyof typeof DEFAULT_DATABASE;
        const dataItems = localDb[key] || [];

        dataItems.forEach((item: any) => {
          const row = headers.map((header) => {
            const val = item[header];
            return typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
          });
          initialRows.push(row);
        });

        await executeWithRetry(() =>
          sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${sheetConfig.name}!A1`,
            valueInputOption: "RAW",
            requestBody: { values: initialRows },
          })
        );
      }
    }
    console.log("Google Sheets database structure verified and initialized correctly.");
  } catch (error) {
    console.error("Error ensuring Google Sheets database structure:", error);
  }
}

// Helper to read data from Google Sheet or fallback
async function fetchSheetData(sheetName: string, headers: string[]): Promise<any[]> {
  const sheets = getGoogleSheets();
  if (!sheets) {
    // No credentials, fall back to local file DB
    const localDb = readLocalDB();
    const key = sheetName.toLowerCase() as keyof typeof DEFAULT_DATABASE;
    return localDb[key] || [];
  }

  try {
    const res: any = await executeWithRetry(() =>
      sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `${sheetName}!A1:Z500`,
      })
    );

    const rows = res.data.values || [];
    if (rows.length <= 1) {
      return [];
    }

    const sheetHeaders = rows[0].map((h: string) => h.trim());
    const items: any[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const item: any = {};
      sheetHeaders.forEach((header: string, index: number) => {
        if (header) {
          const val = row[index] ?? "";
          item[header] = val;
        }
      });
      items.push(item);
    }

    return items;
  } catch (error: any) {
    if (error && error.message && error.message.includes("Unable to parse range")) {
      console.log(`Sheet ${sheetName} not found. Attempting to create missing sheets...`);
      try {
        await ensureGoogleSheetsStructure();
        // Retry fetch once
        const retryRes: any = await executeWithRetry(() =>
          sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${sheetName}!A1:Z500`,
          })
        );
        const retryRows = retryRes.data.values || [];
        if (retryRows.length <= 1) return [];
        const sheetHeaders = retryRows[0].map((h: string) => h.trim());
        const retryItems: any[] = [];
        for (let i = 1; i < retryRows.length; i++) {
          const row = retryRows[i];
          const item: any = {};
          sheetHeaders.forEach((header: string, index: number) => {
            if (header) {
              const val = row[index] ?? "";
              item[header] = val;
            }
          });
          retryItems.push(item);
        }
        return retryItems;
      } catch (retryError) {
         console.error(`Retry failed for ${sheetName}:`, retryError);
      }
    }

    console.error(`Error fetching sheet ${sheetName}, falling back to local file DB:`, error);
    const localDb = readLocalDB();
    const key = sheetName.toLowerCase() as keyof typeof DEFAULT_DATABASE;
    return localDb[key] || [];
  }
}

// Helper to write full data to Google Sheet
async function saveSheetData(sheetName: string, headers: string[], items: any[]) {
  // Always update local DB fallback first for instant responsive feel
  const localDb = readLocalDB();
  const key = sheetName.toLowerCase() as keyof typeof DEFAULT_DATABASE;
  localDb[key] = items as any;
  writeLocalDB(localDb);

  // Clear cache
  cache[key].data = null;
  cache[key].lastUpdated = 0;

  const sheets = getGoogleSheets();
  if (!sheets) {
    return;
  }

  try {
    const values = [headers];
    items.forEach((item) => {
      const row = headers.map((header) => {
        const val = item[header];
        return typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
      });
      values.push(row);
    });

    const updateRoutine = async () => {
      // Clear old contents first to avoid leaving orphaned rows
      await executeWithRetry(() =>
        sheets.spreadsheets.values.clear({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: `${sheetName}!A1:Z1000`,
        })
      );

      // Update with new list
      await executeWithRetry(() =>
        sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: `${sheetName}!A1`,
          valueInputOption: "RAW",
          requestBody: { values },
        })
      );
    };

    try {
      await updateRoutine();
    } catch (error: any) {
      if (error && error.message && error.message.includes("Unable to parse range")) {
        console.log(`Sheet ${sheetName} not found during save. Attempting to create missing sheets...`);
        await ensureGoogleSheetsStructure();
        await updateRoutine();
      } else {
        throw error;
      }
    }
    console.log(`Successfully synced ${sheetName} to Google Sheet`);
  } catch (error) {
    console.error(`Error saving sheet ${sheetName} to Google Sheets:`, error);
  }
}

// Define API Endpoints
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded." });
    }

    const imgbbKey = process.env.IMGBB_API_KEY;
    if (!imgbbKey) {
      // Fallback to local file path if no ImgBB key configured
      const localUrl = `/uploads/${file.filename}`;
      return res.json({ success: true, imageUrl: localUrl });
    }

    // ImgBB Upload
    const base64Image = fs.readFileSync(file.path, { encoding: "base64" });
    const formData = new URLSearchParams();
    formData.append("key", imgbbKey);
    formData.append("image", base64Image);

    // Using native fetch (Available in Node 18+)
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    // Clean up local file after successful upload
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      console.warn("Could not delete temporary file:", e);
    }

    if (data && data.success) {
      res.json({
        success: true,
        fileId: data.data.id,
        imageUrl: data.data.url, // This is the direct image URL from ImgBB
      });
    } else {
      console.error("ImgBB upload failed:", data);
      res.status(500).json({ success: false, error: "Failed to upload to ImgBB." });
    }
  } catch (error: any) {
    console.error("Error uploading to ImgBB:", error);
    res.status(500).json({ success: false, error: "Failed to upload file to ImgBB." });
  }
});

app.get("/api/config", (req, res) => {
  const hasCreds = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && !!process.env.GOOGLE_PRIVATE_KEY;
  res.json({
    hasGoogleCredentials: hasCreds,
    googleSheetId: GOOGLE_SHEET_ID,
    googleDriveFolderId: GOOGLE_DRIVE_FOLDER_ID,
  });
});

// Admin Authentication endpoint (Secure check)
app.post("/api/admin/login", (req, res) => {
  const { passcode } = req.body;
  if (passcode === ADMIN_PASSCODE) {
    return res.json({ success: true, token: "admin-session-token-pea" });
  }
  return res.status(401).json({ success: false, error: "รหัสผ่านแอดมินไม่ถูกต้อง" });
});

// Member Verification endpoint (For internal communication forum entry)
app.post("/api/member/verify", (req, res) => {
  const { passcode } = req.body;
  if (passcode === MEMBER_PASSCODE || passcode === ADMIN_PASSCODE) {
    return res.json({ success: true, token: "member-session-token-pea" });
  }
  return res.status(401).json({ success: false, error: "รหัสผ่านสมาชิกไม่ถูกต้อง" });
});

// NEWS ENDPOINTS with Caching and Fallback
app.get("/api/news", async (req, res) => {
  const now = Date.now();
  if (cache.news.data && now - cache.news.lastUpdated < CACHE_TTL) {
    return res.json(cache.news.data);
  }

  const headers = ["id", "title", "content", "date", "imageUrl", "category", "author", "images"];
  const news = await fetchSheetData("News", headers);
  
  // Parse images if it's stored as a JSON string
  const processedNews = news.map((item) => {
    let images: string[] = [];
    if (item.images) {
      try {
        if (typeof item.images === "string" && item.images.trim().startsWith("[")) {
          images = JSON.parse(item.images);
        } else if (Array.isArray(item.images)) {
          images = item.images;
        } else if (typeof item.images === "string" && item.images) {
          images = [item.images];
        }
      } catch (e) {
        images = item.imageUrl ? [item.imageUrl] : [];
      }
    } else {
      images = item.imageUrl ? [item.imageUrl] : [];
    }
    return {
      ...item,
      images: images.length > 0 ? images : (item.imageUrl ? [item.imageUrl] : [])
    };
  });

  cache.news.data = processedNews;
  cache.news.lastUpdated = now;
  res.json(processedNews);
});

app.post("/api/news", async (req, res) => {
  const headers = ["id", "title", "content", "date", "imageUrl", "category", "author", "images"];
  const newsList = await fetchSheetData("News", headers);
  
  const images = Array.isArray(req.body.images) ? req.body.images : (req.body.imageUrl ? [req.body.imageUrl] : []);
  const newItem = {
    id: `news-${Date.now()}`,
    title: req.body.title || "ไม่มีหัวข้อ",
    content: req.body.content || "",
    date: req.body.date || new Date().toISOString().split("T")[0],
    imageUrl: images[0] || req.body.imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
    category: req.body.category || "ข่าวทั่วไป",
    author: req.body.author || "ผู้จัดการ",
    images: images
  };

  newsList.unshift(newItem); // Add new item to front of list
  await saveSheetData("News", headers, newsList);
  res.json(newItem);
});

app.put("/api/news/:id", async (req, res) => {
  const { id } = req.params;
  const headers = ["id", "title", "content", "date", "imageUrl", "category", "author", "images"];
  const newsList = await fetchSheetData("News", headers);
  
  const index = newsList.findIndex((n) => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "ไม่พบข่าวสารที่ต้องการแก้ไข" });
  }

  let updatedImages = req.body.images;
  if (updatedImages !== undefined) {
    if (typeof updatedImages === "string" && updatedImages.startsWith("[")) {
      try {
        updatedImages = JSON.parse(updatedImages);
      } catch {
        updatedImages = [updatedImages];
      }
    }
  } else {
    // If not specified but imageUrl is updated
    if (req.body.imageUrl && req.body.imageUrl !== newsList[index].imageUrl) {
      updatedImages = [req.body.imageUrl];
    } else {
      // Fallback parse existing images
      const existing = newsList[index].images;
      if (typeof existing === "string" && existing.startsWith("[")) {
        try { updatedImages = JSON.parse(existing); } catch { updatedImages = [existing]; }
      } else if (Array.isArray(existing)) {
        updatedImages = existing;
      } else {
        updatedImages = newsList[index].imageUrl ? [newsList[index].imageUrl] : [];
      }
    }
  }

  if (!Array.isArray(updatedImages)) {
    updatedImages = newsList[index].imageUrl ? [newsList[index].imageUrl] : [];
  }

  newsList[index] = {
    ...newsList[index],
    title: req.body.title ?? newsList[index].title,
    content: req.body.content ?? newsList[index].content,
    date: req.body.date ?? newsList[index].date,
    imageUrl: (updatedImages && updatedImages[0]) ?? req.body.imageUrl ?? newsList[index].imageUrl,
    category: req.body.category ?? newsList[index].category,
    author: req.body.author ?? newsList[index].author,
    images: updatedImages
  };

  await saveSheetData("News", headers, newsList);
  res.json(newsList[index]);
});

app.delete("/api/news/:id", async (req, res) => {
  const { id } = req.params;
  const headers = ["id", "title", "content", "date", "imageUrl", "category", "author", "images"];
  const newsList = await fetchSheetData("News", headers);
  
  const filtered = newsList.filter((n) => n.id !== id);
  await saveSheetData("News", headers, filtered);
  res.json({ success: true });
});

// MEMBERS ENDPOINTS
app.get("/api/members", async (req, res) => {
  const now = Date.now();
  if (cache.members.data && now - cache.members.lastUpdated < CACHE_TTL) {
    return res.json(cache.members.data);
  }

  const headers = ["id", "name", "position", "peaOffice", "email", "phone", "status", "role", "imageUrl"];
  const members = await fetchSheetData("Members", headers);
  
  cache.members.data = members;
  cache.members.lastUpdated = now;
  res.json(members);
});

app.post("/api/members", async (req, res) => {
  const headers = ["id", "name", "position", "peaOffice", "email", "phone", "status", "role", "imageUrl"];
  const membersList = await fetchSheetData("Members", headers);

  const newItem = {
    id: `mem-${Date.now()}`,
    name: req.body.name || "ไม่ทราบชื่อ",
    position: req.body.position || "ผู้จัดการ",
    peaOffice: req.body.peaOffice || "กฟฉ.1",
    email: req.body.email || "",
    phone: req.body.phone || "",
    status: req.body.status || "Active",
    role: req.body.role || "สมาชิก",
    imageUrl: req.body.imageUrl || ""
  };

  membersList.push(newItem);
  await saveSheetData("Members", headers, membersList);
  res.json(newItem);
});

app.put("/api/members/:id", async (req, res) => {
  const { id } = req.params;
  const headers = ["id", "name", "position", "peaOffice", "email", "phone", "status", "role", "imageUrl"];
  const membersList = await fetchSheetData("Members", headers);

  const index = membersList.findIndex((m) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "ไม่พบข้อมูลสมาชิก" });
  }

  membersList[index] = {
    ...membersList[index],
    name: req.body.name ?? membersList[index].name,
    position: req.body.position ?? membersList[index].position,
    peaOffice: req.body.peaOffice ?? membersList[index].peaOffice,
    email: req.body.email ?? membersList[index].email,
    phone: req.body.phone ?? membersList[index].phone,
    status: req.body.status ?? membersList[index].status,
    role: req.body.role ?? membersList[index].role,
    imageUrl: req.body.imageUrl ?? membersList[index].imageUrl,
  };

  await saveSheetData("Members", headers, membersList);
  res.json(membersList[index]);
});

app.delete("/api/members/:id", async (req, res) => {
  const { id } = req.params;
  const headers = ["id", "name", "position", "peaOffice", "email", "phone", "status", "role", "imageUrl"];
  const membersList = await fetchSheetData("Members", headers);

  const filtered = membersList.filter((m) => m.id !== id);
  await saveSheetData("Members", headers, filtered);
  res.json({ success: true });
});

// CALENDAR ENDPOINTS
app.get("/api/calendar", async (req, res) => {
  const now = Date.now();
  if (cache.calendar.data && now - cache.calendar.lastUpdated < CACHE_TTL) {
    return res.json(cache.calendar.data);
  }

  const headers = ["id", "title", "description", "date", "time", "location", "category"];
  const calendar = await fetchSheetData("Calendar", headers);
  
  cache.calendar.data = calendar;
  cache.calendar.lastUpdated = now;
  res.json(calendar);
});

app.post("/api/calendar", async (req, res) => {
  const headers = ["id", "title", "description", "date", "time", "location", "category"];
  const calendarList = await fetchSheetData("Calendar", headers);

  const newItem = {
    id: `cal-${Date.now()}`,
    title: req.body.title || "กิจกรรมชมรม",
    description: req.body.description || "",
    date: req.body.date || new Date().toISOString().split("T")[0],
    time: req.body.time || "09:00",
    location: req.body.location || "กฟฉ.1",
    category: req.body.category || "กิจกรรม"
  };

  calendarList.push(newItem);
  await saveSheetData("Calendar", headers, calendarList);
  res.json(newItem);
});

app.put("/api/calendar/:id", async (req, res) => {
  const { id } = req.params;
  const headers = ["id", "title", "description", "date", "time", "location", "category"];
  const calendarList = await fetchSheetData("Calendar", headers);

  const index = calendarList.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "ไม่พบกิจกรรม" });
  }

  calendarList[index] = {
    ...calendarList[index],
    title: req.body.title ?? calendarList[index].title,
    description: req.body.description ?? calendarList[index].description,
    date: req.body.date ?? calendarList[index].date,
    time: req.body.time ?? calendarList[index].time,
    location: req.body.location ?? calendarList[index].location,
    category: req.body.category ?? calendarList[index].category,
  };

  await saveSheetData("Calendar", headers, calendarList);
  res.json(calendarList[index]);
});

app.delete("/api/calendar/:id", async (req, res) => {
  const { id } = req.params;
  const headers = ["id", "title", "description", "date", "time", "location", "category"];
  const calendarList = await fetchSheetData("Calendar", headers);

  const filtered = calendarList.filter((c) => c.id !== id);
  await saveSheetData("Calendar", headers, filtered);
  res.json({ success: true });
});

// MESSAGES (SECURE INTERNAL CHAT) ENDPOINTS
app.get("/api/messages", async (req, res) => {
  const now = Date.now();
  if (cache.messages.data && now - cache.messages.lastUpdated < CACHE_TTL) {
    return res.json(cache.messages.data);
  }

  const headers = ["id", "senderName", "senderPosition", "message", "timestamp"];
  const messages = await fetchSheetData("Messages", headers);
  
  // Sort messages by timestamp ascending
  messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  cache.messages.data = messages;
  cache.messages.lastUpdated = now;
  res.json(messages);
});

app.post("/api/messages", async (req, res) => {
  const headers = ["id", "senderName", "senderPosition", "message", "timestamp"];
  const messagesList = await fetchSheetData("Messages", headers);

  const newItem = {
    id: `msg-${Date.now()}`,
    senderName: req.body.senderName || "ผู้จัดการนิรนาม",
    senderPosition: req.body.senderPosition || "สมาชิกชมรม",
    message: req.body.message || "",
    timestamp: new Date().toISOString()
  };

  messagesList.push(newItem);
  
  // Keep only last 100 messages to prevent infinite growth on the spreadsheet
  if (messagesList.length > 100) {
    messagesList.shift();
  }

  await saveSheetData("Messages", headers, messagesList);
  res.json(newItem);
});

// GOOGLE DRIVE PHOTOS LISTING
app.get("/api/drive-images", async (req, res) => {
  const drive = getGoogleDrive();
  if (!drive) {
    // Return stunning PEA or utility images when Google Drive is not connected yet
    return res.json([
      {
        id: "img-static-1",
        name: "PEA Smart Grid",
        webViewLink: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800",
        thumbnailLink: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=200",
      },
      {
        id: "img-static-2",
        name: "PEA Maintenance Team",
        webViewLink: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&q=80&w=800",
        thumbnailLink: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&q=80&w=200",
      },
      {
        id: "img-static-3",
        name: "Smart City Grid",
        webViewLink: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=800",
        thumbnailLink: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=200",
      },
      {
        id: "img-static-4",
        name: "PEA Eco Solar Energy",
        webViewLink: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800",
        thumbnailLink: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=200",
      }
    ]);
  }

  try {
    const listRes: any = await executeWithRetry(() =>
      drive.files.list({
        q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: "files(id, name, webViewLink, thumbnailLink, webContentLink)",
        pageSize: 30,
      })
    );

    const files = listRes.data.files || [];
    res.json(files);
  } catch (error) {
    console.error("Error listing files from Google Drive:", error);
    res.status(500).json({ error: "Failed to load files from Google Drive folder" });
  }
} );

// ============================================================
// IMAGE UPLOAD FALLBACK SYSTEM
// Order: Google Drive → uguu.se → litterbox.catbox.moe → ImgBB → local
// ============================================================

function makeMultipartBuffer(parts: Array<{name: string; value?: string; filename?: string; contentType?: string; fileBuffer?: Buffer}>): { body: Buffer; boundary: string } {
  const boundary = '----FormBoundary' + Date.now().toString(36);
  const chunks: Buffer[] = [];
  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    if (part.filename && part.fileBuffer) {
      chunks.push(Buffer.from(`Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"\r\n`));
      chunks.push(Buffer.from(`Content-Type: ${part.contentType || 'application/octet-stream'}\r\n\r\n`));
      chunks.push(part.fileBuffer);
    } else {
      chunks.push(Buffer.from(`Content-Disposition: form-data; name="${part.name}"\r\n\r\n`));
      chunks.push(Buffer.from(part.value || ''));
    }
    chunks.push(Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(chunks), boundary };
}

function httpsPost(hostname: string, urlPath: string, body: Buffer, contentType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST',
      hostname,
      path: urlPath,
      headers: {
        'Content-Type': contentType,
        'Content-Length': body.length,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Fallback 1: uguu.se (48h retention, no key needed, tested & confirmed working)
async function uploadToUguu(filePath: string, mimetype: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const { body, boundary } = makeMultipartBuffer([
    { name: 'files[]', filename, contentType: mimetype, fileBuffer }
  ]);
  
  const response = await httpsPost('uguu.se', '/upload', body, `multipart/form-data; boundary=${boundary}`);
  
  try {
    const parsed = JSON.parse(response);
    if (parsed.files && parsed.files[0] && parsed.files[0].url) {
      return parsed.files[0].url;
    }
  } catch {}
  
  const trimmed = response.trim();
  if (trimmed.startsWith('http')) return trimmed;
  
  throw new Error(`uguu.se error: ${response.substring(0, 200)}`);
}

// Fallback 2: litterbox.catbox.moe (72h retention, no key needed, tested & confirmed working)
async function uploadToLitterbox(filePath: string, mimetype: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const { body, boundary } = makeMultipartBuffer([
    { name: 'reqtype', value: 'fileupload' },
    { name: 'time', value: '72h' },
    { name: 'fileToUpload', filename, contentType: mimetype, fileBuffer }
  ]);
  
  const response = await httpsPost('litterbox.catbox.moe', '/resources/internals/api.php', body, `multipart/form-data; boundary=${boundary}`);
  const url = response.trim();
  if (url.startsWith('https://')) return url;
  throw new Error(`litterbox error: ${response.substring(0, 200)}`);
}

// Fallback 3: ImgBB (permanent, needs IMGBB_API_KEY env var)
async function uploadToImgBB(apiKey: string, filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Image = fileBuffer.toString('base64');
  const { body, boundary } = makeMultipartBuffer([
    { name: 'image', value: base64Image }
  ]);
  
  const response = await httpsPost('api.imgbb.com', `/1/upload?key=${apiKey}`, body, `multipart/form-data; boundary=${boundary}`);
  
  try {
    const parsed = JSON.parse(response);
    if (parsed.success && parsed.data && parsed.data.url) {
      return parsed.data.url;
    }
  } catch {}
  throw new Error(`ImgBB error: ${response.substring(0, 200)}`);
}

// Fallback 4: Catbox.moe (permanent, no key needed, may be blocked from cloud IPs)
async function uploadToCatbox(filePath: string, mimetype: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const { body, boundary } = makeMultipartBuffer([
    { name: 'reqtype', value: 'fileupload' },
    { name: 'fileToUpload', filename, contentType: mimetype, fileBuffer }
  ]);
  
  const response = await httpsPost('catbox.moe', '/user/api.php', body, `multipart/form-data; boundary=${boundary}`);
  const url = response.trim();
  if (url.startsWith('https://')) return url;
  throw new Error(`Catbox error: ${response.substring(0, 200)}`);
}

// Master fallback router - tries all services in order
async function uploadToFallback(filePath: string, mimetype: string): Promise<string> {
  const services = [
    { name: 'uguu.se', fn: () => uploadToUguu(filePath, mimetype) },
    { name: 'litterbox.catbox.moe', fn: () => uploadToLitterbox(filePath, mimetype) },
    ...(process.env.IMGBB_API_KEY ? [{ name: 'ImgBB', fn: () => uploadToImgBB(process.env.IMGBB_API_KEY!, filePath) }] : []),
    { name: 'catbox.moe', fn: () => uploadToCatbox(filePath, mimetype) },
  ];
  
  const errors: string[] = [];
  for (const svc of services) {
    try {
      console.log(`Attempting fallback upload to ${svc.name}...`);
      const url = await svc.fn();
      console.log(`✅ ${svc.name} upload succeeded: ${url}`);
      return url;
    } catch (err: any) {
      const msg = err.message || String(err);
      console.warn(`❌ ${svc.name} upload failed: ${msg}`);
      errors.push(`${svc.name}: ${msg}`);
    }
  }
  throw new Error(`All fallback uploads failed: ${errors.join(' | ')}`);
}

// IMAGE UPLOAD ENDPOINT
app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "กรุณาอัปโหลดไฟล์รูปภาพ" });
  }

  const localPath = `/uploads/${req.file.filename}`;
  const fullLocalPath = path.join(UPLOADS_DIR, req.file.filename);
  const mimetype = req.file.mimetype;
  
  // Try Google Drive first
  const drive = getGoogleDrive();
  if (drive && GOOGLE_DRIVE_FOLDER_ID) {
    try {
      console.log(`Uploading ${req.file.filename} to Google Drive folder: ${GOOGLE_DRIVE_FOLDER_ID}`);
      
      const driveResponse: any = await executeWithRetry(() =>
        drive.files.create({
          requestBody: {
            name: req.file!.originalname,
            parents: [GOOGLE_DRIVE_FOLDER_ID],
          },
          media: {
            mimeType: mimetype,
            body: fs.createReadStream(fullLocalPath),
          },
          fields: "id, webViewLink, webContentLink",
        })
      );

      const driveFile = driveResponse.data;
      console.log("Google Drive upload succeeded. File ID:", driveFile.id);

      try {
        await executeWithRetry(() =>
          drive.permissions.create({
            fileId: driveFile.id!,
            requestBody: { role: "reader", type: "anyone" },
          })
        );
      } catch (permError) {
        console.warn("Permission set failed (OK if folder is public):", permError);
      }

      return res.json({
        success: true,
        imageUrl: `https://lh3.googleusercontent.com/d/${driveFile.id}`,
        localUrl: localPath,
        driveUrl: driveFile.webContentLink || driveFile.webViewLink,
      });

    } catch (driveError: any) {
      console.error("Google Drive upload failed, trying fallback services...");
    }
  }

  // Google Drive failed or not configured → try fallback services
  try {
    const fallbackUrl = await uploadToFallback(fullLocalPath, mimetype);
    return res.json({
      success: true,
      imageUrl: fallbackUrl,
      localUrl: localPath,
    });
  } catch (fallbackErr: any) {
    console.error("All upload services failed:", fallbackErr.message);
    // Last resort: return local path (will only work temporarily on Vercel)
    return res.json({
      success: true,
      imageUrl: localPath,
      localUrl: localPath,
      warning: "ไม่สามารถอัปโหลดไปยังระบบจัดเก็บถาวรได้ รูปภาพอาจหายหลังจากเซิร์ฟเวอร์รีสตาร์ท"
    });
  }
});

// AI ASSISTANT: HELP DRAFT NEWS WITH GEMINI
app.post("/api/ai/draft-news", async (req, res) => {
  if (!aiClient) {
    return res.status(400).json({ error: "ฟังก์ชัน AI ยังไม่ได้กำหนดคีย์ GEMINI_API_KEY ในระบบ" });
  }

  const { topic, keyPoints } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "กรุณาระบุหัวข้อข่าวที่จะให้ AI ช่วยร่าง" });
  }

  try {
    const prompt = `คุณคือผู้ช่วยงานประชาสัมพันธ์ส่วนตัวของ ชมรมผู้จัดการการไฟฟ้าส่วนภูมิภาค เขต 1 (ภาคตะวันออกเฉียงเหนือ) จังหวัดอุดรธานี (กฟฉ.1)
รบกวนช่วยเขียนร่างข่าวสารประชาสัมพันธ์อย่างเป็นทางการ ภาษาไทยที่สุภาพ เรียบร้อย และดูเป็นมืออาชีพสำหรับลงเว็บไซต์ชมรม โดยอิงตามข้อมูลต่อไปนี้:
หัวข้อข่าว: ${topic}
ประเด็นสำคัญเพิ่มเติม: ${keyPoints || "ไม่มีประเด็นเพิ่มเติม"}

กรุณาร่างข้อความข่าวให้ครบถ้วน ความยาวกำลังดี (ประมาณ 150-300 คำ) มีส่วนหัวข่าว เนื้อหาใจความ และระบุท้ายข่าวว่ามาจากฝ่ายประชาสัมพันธ์ชมรมผู้จัดการ กฟฉ.1`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });





    const draftText = response.text;
    res.json({ draft: draftText });
  } catch (error: any) {
    console.error("Gemini AI News drafting error:", error);
    res.status(500).json({ error: "AI ไม่สามารถสร้างเนื้อหาได้ในขณะนี้: " + error.message });
  }
});

// REGULATIONS ENDPOINTS
app.get("/api/regulations", async (req, res) => {
  const now = Date.now();
  if (cache.regulations.data && now - cache.regulations.lastUpdated < CACHE_TTL) {
    return res.json(cache.regulations.data);
  }

  const headers = ["id", "title", "content", "date", "pdfUrl", "images"];
  const regulations = await fetchSheetData("Regulations", headers);
  
  const processedRegulations = regulations.map((item) => {
    let images: string[] = [];
    if (item.images) {
      try {
        if (typeof item.images === "string" && item.images.trim().startsWith("[")) {
          images = JSON.parse(item.images);
        } else if (Array.isArray(item.images)) {
          images = item.images;
        } else if (typeof item.images === "string" && item.images) {
          images = [item.images];
        }
      } catch (e) {
        images = [];
      }
    }
    return {
      ...item,
      images: images
    };
  });

  cache.regulations.data = processedRegulations;
  cache.regulations.lastUpdated = now;
  res.json(processedRegulations);
});

app.post("/api/regulations", async (req, res) => {
  const headers = ["id", "title", "content", "date", "pdfUrl", "images"];
  const regulationsList = await fetchSheetData("Regulations", headers);

  const images = Array.isArray(req.body.images) ? req.body.images : [];

  const newItem = {
    id: `reg-${Date.now()}`,
    title: req.body.title || "ไม่มีหัวข้อ",
    content: req.body.content || "",
    date: req.body.date || new Date().toISOString().split("T")[0],
    pdfUrl: req.body.pdfUrl || "",
    images: images
  };

  regulationsList.push(newItem);
  await saveSheetData("Regulations", headers, regulationsList);
  res.json(newItem);
});

app.put("/api/regulations/:id", async (req, res) => {
  const { id } = req.params;
  const headers = ["id", "title", "content", "date", "pdfUrl", "images"];
  const regulationsList = await fetchSheetData("Regulations", headers);
  
  const index = regulationsList.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "ไม่พบระเบียบที่ต้องการแก้ไข" });
  }

  let updatedImages = req.body.images;
  if (updatedImages !== undefined) {
    if (typeof updatedImages === "string" && updatedImages.startsWith("[")) {
      try {
        updatedImages = JSON.parse(updatedImages);
      } catch {
        updatedImages = [updatedImages];
      }
    }
  } else {
    const existing = regulationsList[index].images;
    if (typeof existing === "string" && existing.startsWith("[")) {
      try { updatedImages = JSON.parse(existing); } catch { updatedImages = [existing]; }
    } else if (Array.isArray(existing)) {
      updatedImages = existing;
    } else {
      updatedImages = [];
    }
  }

  if (!Array.isArray(updatedImages)) {
    updatedImages = [];
  }

  regulationsList[index] = {
    ...regulationsList[index],
    title: req.body.title ?? regulationsList[index].title,
    content: req.body.content ?? regulationsList[index].content,
    date: req.body.date ?? regulationsList[index].date,
    pdfUrl: req.body.pdfUrl ?? regulationsList[index].pdfUrl,
    images: updatedImages
  };

  await saveSheetData("Regulations", headers, regulationsList);
  res.json(regulationsList[index]);
});

app.delete("/api/regulations/:id", async (req, res) => {
  const { id } = req.params;
  const headers = ["id", "title", "content", "date", "pdfUrl", "images"];
  const regulationsList = await fetchSheetData("Regulations", headers);
  
  const filtered = regulationsList.filter((r) => r.id !== id);
  await saveSheetData("Regulations", headers, filtered);
  res.json({ success: true });
});

// Share dynamic Open Graph endpoint
app.get("/api/share/:newsId", async (req, res) => {
  const { newsId } = req.params;
  try {
    const headers = ["id", "title", "content", "date", "category", "author", "imageUrl", "images", "views"];
    const newsList = await fetchSheetData("News", headers);
    const newsItem = newsList.find((n: any) => String(n.id) === String(newsId));

    if (!newsItem) {
      return res.redirect("/?newsId=" + encodeURIComponent(newsId));
    }

    let imageUrl = newsItem.imageUrl || "https://manager-ne-1-website.vercel.app/logo.jpg";
    if (newsItem.images) {
      let imgs: string[] = [];
      if (typeof newsItem.images === "string" && newsItem.images.trim().startsWith("[")) {
        try { imgs = JSON.parse(newsItem.images); } catch (e) {}
      } else if (Array.isArray(newsItem.images)) {
        imgs = newsItem.images;
      }
      if (imgs.length > 0 && imgs[0]) {
        imageUrl = imgs[0];
      }
    }

    const title = (newsItem.title || "ข่าวประชาสัมพันธ์").replace(/"/g, '&quot;');
    const description = (newsItem.content || "เว็บไซต์ข่าวประชาสัมพันธ์ชมรมผู้จัดการ กฟฉ.1")
      .substring(0, 150)
      .replace(/"/g, '&quot;');
    const url = `https://manager-ne-1-website.vercel.app/?newsId=${encodeURIComponent(newsId)}`;

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
  <script>
    window.location.href = "/?newsId=${encodeURIComponent(newsId)}";
  </script>
</body>
</html>`;
    res.send(html);
  } catch (error) {
    res.redirect("/?newsId=" + encodeURIComponent(newsId));
  }
});

// Vite & Static file handling
async function startServer() {
  // Ensure Google Sheet structure is verified before starting HTTP server
  await ensureGoogleSheetsStructure();

  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PEA District 1 Manager's Club server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

