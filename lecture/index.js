const xlsx = require("xlsx");
const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const add_to_sheet = require("./add_to_sheet");

const workbook = xlsx.readFile("xlsx/data.xlsx");
const ws = workbook.Sheets.영화목록;
const records = xlsx.utils.sheet_to_json(ws);

fs.readdir("screenshot", err => {
  if (err) {
    console.error("screenshot folder가 없어 생성함");
    fs.mkdirSync("screenshot"); // sync 메서드는 프로그램의 처음과 끝에만 쓰기.
  }
});

fs.readdir("poster", err => {
  if (err) {
    console.error("poster folder가 없어 생성함");
    fs.mkdirSync("poster");
  }
});

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === "production",
      args: ["--window-size=1920,1080"] // browser크기
    });
    const page = await browser.newPage();
    await page.setViewport({
      // 화면 크기
      width: 1920,
      height: 1920
    });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36"
    );
    add_to_sheet(ws, "C1", "s", "평점");
    for (const [i, r] of records.entries()) {
      await page.goto(r.링크);
      const result = await page.evaluate(() => {
        const scoreEl = document.querySelector(".score.score_left .star_score");
        let score = "";
        if (scoreEl) {
          score = scoreEl.textContent;
        }
        const imgEl = document.querySelector(".poster img");
        let img = "";
        if (imgEl) {
          img = imgEl.src;
        }
        return { score, img };
      });
      if (result.score) {
        const newCell = "C" + (i + 2);
        add_to_sheet(ws, newCell, "n", parseFloat(result.score.trim()));
      }
      if (result.img) {
        await page.screenshot({
          path: `screenshot/${r.제목}.png`,
          // fullpage: true,
          clip: {
            x: 100,
            y: 100,
            width: 300,
            height: 300
          }
        });
        const imgResult = await axios.get(
          result.img.replace(/\?.*$/, ""), // 쿼리스트링(?부터 끝까지) 제거 정규표현식
          {
            responseType: "arraybuffer" //buffer가 연속적으로 들어있는 자료구조
          }
        );
        fs.writeFileSync(`poster/${r.제목}.jpg`, imgResult.data);
      }
      await page.waitFor(1000);
    }
    await page.close();
    await browser.close();
    xlsx.writeFile(workbook, "xlsx/result.xlsx");
  } catch (err) {
    console.error(err);
  }
};

crawler();
