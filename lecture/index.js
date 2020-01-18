const parse = require("csv-parse/lib/sync");
const fs = require("fs");
const puppeteer = require("puppeteer");

const csv = fs.readFileSync("csv/data.csv");
const records = parse(csv.toString("utf-8"));

const crawler = async () => {
  try {
    const result = [];
    const browser = await puppeteer.launch({ headless: process.env.NODE_ENV === "production" });
    // false일때 화면이 보임(개발중), 배포시에는 true
    await Promise.all(
      records.map(async (r, i) => {
        try {
          const page = await browser.newPage();
          await page.goto(r[1]);
          const text = await page.evaluate(() => { // return 값을 text로 받는다
            // evaluate를 먼저쓰면 한번만 쓰고 깔끔하게 태그들을 모을 수 있다. 그리고 안에서 DOM 사용가능
            const score = document.querySelector(".score.score_left .star_score");
            if (score) {
              return score.textContent;
            }
          });
          if (text) {
            result[i] = [r[0], r[1], text.trim()]; // data.csv 순서 그대로 유지
          }
          await page.waitFor(3000);
          await page.close();
        } catch (err) {
          console.error(err);
        }
      })
    );
    await browser.close();
    const str = stringify(result);
    fs.writeFileSync("csv/result.csv", str);
  } catch (err) {
    console.error(err);
  }
};

crawler();
