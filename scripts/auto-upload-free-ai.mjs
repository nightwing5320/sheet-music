import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ALBUM_DIR = './my-sheet-album';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processAndUpload() {
  if (!fs.existsSync(ALBUM_DIR)) {
    fs.mkdirSync(ALBUM_DIR);
    console.log(`📁 請將樂譜照片放入「${ALBUM_DIR}」資料夾後重新執行！`);
    return;
  }

  const files = fs.readdirSync(ALBUM_DIR).filter((file) =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

  if (files.length === 0) {
    console.log(`⚠️ 在「${ALBUM_DIR}」資料夾中沒有找到圖片檔。`);
    return;
  }

  if (!GEMINI_API_KEY) {
    console.error('❌ 錯誤：未在 .env.local 中設定 GEMINI_API_KEY');
    return;
  }

  console.log(`🚀 找到 ${files.length} 張圖片，開始進行辨識與自動上傳...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(ALBUM_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');
    const ext = path.extname(file).replace('.', '').toLowerCase();
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    console.log(`\n----------------------------------- [${i + 1}/${files.length}]`);
    console.log(`🔍 正在辨識樂譜：${file}...`);

    try {
      // 1. 呼叫 Gemini REST API 辨識
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: '這是一張樂譜圖片。請辨識並提取這首樂譜的「歌名/標題」以及「調性/Key (例如 C, G, D, Am, Eb)」。請只嚴格輸出 JSON 格式，包含 title 與 key 兩個欄位，不要輸出任何額外 Markdown 標記或文字。例如：{"title": "卡農", "key": "D"}',
                  },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Gemini API 呼叫失敗');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      const rawText = responseText.replace(/```json|```/g, '').trim();
      const aiResult = JSON.parse(rawText);

      const title = aiResult.title || path.parse(file).name;
      const key = aiResult.key || '';

      console.log(`✨ Gemini 辨識結果：標題 =「${title}」, 調性 =「${key}」`);

      // 2. 上傳圖片至 Supabase Storage
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const storagePath = `uploads/${fileName}`;

      console.log(`📤 上傳圖片至 Supabase Storage...`);
      const { error: uploadError } = await supabase.storage
        .from('music-sheets')
        .upload(storagePath, fileBuffer, { contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('music-sheets')
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      // 3. 寫入 Supabase sheets 資料表
      console.log(`💾 寫入資料庫...`);
      const { error: dbError } = await supabase.from('sheets').insert([
        {
          title,
          artist: key,
          file_url: publicUrl,
          image_urls: [publicUrl],
        },
      ]);

      if (dbError) throw dbError;

      // 4. 上傳與寫入成功後，刪除本機檔案
      fs.unlinkSync(filePath);
      console.log(`✅ 樂譜「${title}」處理完畢，已成功上傳並刪除本機檔案！`);

    } catch (err) {
      console.error(`❌ 處理 ${file} 失敗，保留本機檔案：`, err.message || err);
    }

    // 防 exceed quota 的冷卻延遲
    if (i < files.length - 1) {
      console.log(`⏳ 等待 4 秒後處理下一張...`);
      await sleep(4000);
    }
  }

  console.log(`\n🎉 所有照片處理完畢！`);
}

processAndUpload();