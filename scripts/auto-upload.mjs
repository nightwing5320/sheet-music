import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// 1. 初始化 Supabase 與 OpenAI
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 照片所在的本地資料夾路徑
const ALBUM_DIR = './my-sheet-album';

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

  console.log(`🚀 找到 ${files.length} 張圖片，開始進行 AI 自動辨識與上傳...`);

  for (const file of files) {
    const filePath = path.join(ALBUM_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');
    const ext = path.extname(file).replace('.', '');

    console.log(`\n-----------------------------------`);
    console.log(`🔍 正在辨識樂譜：${file}...`);

    try {
      // 2. 使用 OpenAI Vision 辨識樂譜標題與調性
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '這是一張樂譜圖片。請辨識並提取這首樂譜的「歌名/標題」以及「調性/Key (例如 C, G, Am, Eb)」。請只嚴格輸出 JSON 格式，包含 title 與 key 兩個欄位，不要輸出任何額外文字。例如：{"title": "卡農", "key": "D"}',
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/${ext};base64,${base64Image}` },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      });

      const aiResult = JSON.parse(response.choices[0].message.content);
      const title = aiResult.title || path.parse(file).name;
      const key = aiResult.key || '';

      console.log(`✨ AI 辨識結果：標題 =「${title}」, 調性 =「${key}」`);

      // 3. 上傳圖片至 Supabase Storage
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const storagePath = `uploads/${fileName}`;

      console.log(`📤 上傳圖片至 Supabase Storage...`);
      const { error: uploadError } = await supabase.storage
        .from('music-sheets')
        .upload(storagePath, fileBuffer, { contentType: `image/${ext}` });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('music-sheets')
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      // 4. 寫入 Supabase sheets 資料表
      console.log(`💾 寫入資料庫...`);
      const { error: dbError } = await supabase.from('sheets').insert([
        {
          title,
          artist: key, // 寫入現有的 artist (調性) 欄位
          file_url: publicUrl,
          image_urls: [publicUrl],
        },
      ]);

      if (dbError) throw dbError;

      console.log(`✅ 樂譜「${title}」處理完畢並成功上傳！`);
    } catch (err) {
      console.error(`❌ 處理 ${file} 失敗：`, err.message || err);
    }
  }

  console.log(`\n🎉 所有照片批次辨識與上傳完成！`);
}

processAndUpload();