import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const menuItems = [
  { name: "蛋餅", description: "香脆蛋餅，外皮酥脆、蛋香四溢", price: 35, category: "蛋餅類", ingredients: ["蛋", "麵皮"] },
  { name: "起司蛋餅", description: "加入濃郁起司，口感更豐富", price: 45, category: "蛋餅類", ingredients: ["蛋", "麵皮", "起司"] },
  { name: "火腿蛋餅", description: "火腿與蛋的經典組合", price: 45, category: "蛋餅類", ingredients: ["蛋", "麵皮", "火腿"] },
  { name: "總匯蛋餅", description: "火腿、起司、蔬菜全包，一次滿足", price: 55, category: "蛋餅類", ingredients: ["蛋", "麵皮", "火腿", "起司", "蔬菜"] },
  { name: "吐司", description: "酥烤厚片吐司，奶油香氣濃郁", price: 20, category: "吐司類", ingredients: ["吐司", "奶油"] },
  { name: "火腿起司吐司", description: "夾入火腿與起司，經典美味", price: 40, category: "吐司類", ingredients: ["吐司", "火腿", "起司"] },
  { name: "總匯三明治", description: "火腿、蛋、生菜、番茄，層次豐富", price: 55, category: "吐司類", ingredients: ["吐司", "火腿", "蛋", "生菜", "番茄"] },
  { name: "花生醬吐司", description: "香濃花生醬塗抹，甜而不膩", price: 25, category: "吐司類", ingredients: ["吐司", "花生醬"] },
  { name: "燒餅油條", description: "傳統燒餅夾油條，台式早餐必吃", price: 35, category: "燒餅類", ingredients: ["燒餅", "油條"] },
  { name: "燒餅蛋", description: "燒餅夾入新鮮雞蛋，簡單美味", price: 40, category: "燒餅類", ingredients: ["燒餅", "蛋"] },
  { name: "飯糰", description: "糯米飯包入油條和肉鬆，扎實有飽足感", price: 40, category: "飯類", ingredients: ["糯米飯", "油條", "肉鬆", "海苔"] },
  { name: "粥", description: "清爽白粥，配上醬菜，暖胃健康", price: 35, category: "飯類", ingredients: ["白粥", "醬菜"] },
  { name: "豆漿", description: "現磨新鮮豆漿，濃郁豆香", price: 20, category: "飲料類", ingredients: ["黃豆"] },
  { name: "米漿", description: "香濃米漿，台灣傳統早餐飲品", price: 20, category: "飲料類", ingredients: ["米", "花生"] },
  { name: "奶茶", description: "紅茶加入鮮奶，香醇滑順", price: 25, category: "飲料類", ingredients: ["紅茶", "鮮奶"] },
  { name: "熱咖啡", description: "香醇美式咖啡，提神醒腦", price: 35, category: "飲料類", ingredients: ["咖啡豆"] },
  { name: "鮮榨柳橙汁", description: "現榨新鮮柳橙，維他命C補充", price: 45, category: "飲料類", ingredients: ["柳橙"] },
  { name: "荷包蛋", description: "單點荷包蛋，可加入任何餐點", price: 15, category: "加點類", ingredients: ["蛋"] },
  { name: "培根", description: "香脆培根片，美式早餐風格", price: 25, category: "加點類", ingredients: ["豬肉"] },
  { name: "薯餅", description: "金黃酥脆薯餅，外酥內軟", price: 25, category: "加點類", ingredients: ["馬鈴薯"] },
];

async function main() {
  console.log("🌱 開始填入種子資料...");

  const adminPass = await bcrypt.hash("Admin1234", 12);
  const staffPass = await bcrypt.hash("Staff1234", 12);
  const userPass  = await bcrypt.hash("User12345", 12);

  await prisma.user.upsert({
    where: { email: "admin@breakfast.tw" },
    update: {},
    create: { email: "admin@breakfast.tw", password: adminPass, name: "店長 Lisa", role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "staff@breakfast.tw" },
    update: {},
    create: { email: "staff@breakfast.tw", password: staffPass, name: "廚師王阿姨", role: "STAFF" },
  });

  await prisma.user.upsert({
    where: { email: "user@breakfast.tw" },
    update: {},
    create: { email: "user@breakfast.tw", password: userPass, name: "Alex 陳", role: "USER" },
  });

  console.log("✅ 用戶建立完成");

  // Delete existing menu items first to avoid duplicates on re-seed
  await prisma.menuItem.deleteMany({});
  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }

  console.log("✅ 菜單建立完成 (20 項)");
  console.log("\n📋 測試帳號：");
  console.log("  管理員: admin@breakfast.tw / Admin1234");
  console.log("  廚師:   staff@breakfast.tw / Staff1234");
  console.log("  顧客:   user@breakfast.tw  / User12345");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
