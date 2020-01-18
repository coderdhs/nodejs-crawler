const parse = require("csv-parse/lib/sync");
const fs = require("fs");
const puppeteer = require("puppeteer");

const csv = fs.readFileSync("csv/data.csv");
const records = parse(csv.toString("utf-8"));

const crawler = async () => {
  const browser = await puppeteer.launch({ headless: process.env.NODE_ENV === "production" });
  // false일때 화면이 보임(개발중), 배포시에는 true

  const [page, page2, page3] = await Promise.all([
    await browser.newPage(),
    await browser.newPage(),
    await browser.newPage()
  ]);
  await Promise.all([
    page.goto("https://zerocho.com"),
    page2.goto("https://naver.com"),
    page3.goto("https://google.com")
  ]);
  await Promise.all([page.waitFor(3000), page2.waitFor(1000), page3.waitFor(2000)]);
  await page.close();
  await page2.close();
  await page3.close();
  await browser.close();
};

crawler();
