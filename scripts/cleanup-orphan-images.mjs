// 清除 Storage 中沒有任何樂譜使用的圖片
// 預覽：node scripts/cleanup-orphan-images.mjs
// 刪除：node scripts/cleanup-orphan-images.mjs --delete
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// 本機腳本使用 service role key（略過 RLS），切勿在前端使用
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'music-sheets';
const MARKER = `/object/public/${BUCKET}/`;
const shouldDelete = process.argv.includes('--delete');

async function listFiles(prefix) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 10000 });
  if (error) throw error;
  // 資料夾沒有 id，只保留檔案
  return data.filter((item) => item.id).map((item) => ({
    path: prefix ? `${prefix}/${item.name}` : item.name,
    size: item.metadata?.size || 0,
    createdAt: item.created_at,
  }));
}

async function main() {
  const { data: sheets, error } = await supabase.from('sheets').select('file_url, image_urls');
  if (error) throw error;

  const used = new Set(
    sheets
      .flatMap((sheet) => [sheet.file_url, ...(sheet.image_urls || [])])
      .filter((url) => url && url.includes(MARKER))
      .map((url) => decodeURIComponent(url.slice(url.indexOf(MARKER) + MARKER.length)))
  );

  const files = [...(await listFiles('')), ...(await listFiles('uploads'))];
  const orphans = files.filter((file) => !used.has(file.path));

  console.log(`📚 樂譜數：${sheets.length}，Storage 檔案數：${files.length}`);
  orphans.forEach((file) =>
    console.log(`  ${file.createdAt.slice(0, 10)}  ${String(Math.round(file.size / 1024)).padStart(5)}KB  ${file.path}`)
  );
  const totalMB = (orphans.reduce((sum, file) => sum + file.size, 0) / 1e6).toFixed(1);
  console.log(`🗑️  未使用的檔案：${orphans.length} 個（${totalMB} MB）`);

  if (orphans.length === 0) return;

  if (!shouldDelete) {
    console.log('\n這只是預覽，未刪除任何檔案。確認後加上 --delete 執行刪除。');
    return;
  }

  const { data: removed, error: removeError } = await supabase.storage
    .from(BUCKET)
    .remove(orphans.map((file) => file.path));
  if (removeError) throw removeError;
  console.log(`✅ 已刪除 ${removed.length} 個檔案`);
}

main().catch((err) => {
  console.error('❌ 執行失敗：', err.message || err);
  process.exit(1);
});
