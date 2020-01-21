const puppeteer = require("puppeteer");
const dotenv = require("dotenv");

const db = require("./models");
dotenv.config();

const crawler = async () => {
  await db.sequelize.sync(); // 크롤러 돌리면서 디비연결
  try {
    let browser = await puppeteer.launch({
      headless: false,
      args: ["--window-size=1920,1080", "--disable-notifications"]
    });
    let page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.goto("http://spys.one/free-proxy-list/KR/");
    const proxies = await page.evaluate(() => {
      const ips = Array.from(document.querySelectorAll("tr > td:nth-child(1) > font.spy14")).map(
        v => v.innerText
      );
      const types = Array.from(document.querySelectorAll("tr > td:nth-child(2)"))
        .slice(4)
        .map(v => v.textContent);
      const latencies = Array.from(
        document.querySelectorAll("tr > td:nth-child(6) > font.spy1")
      ).map(v => v.textContent);
      return ips.map((v, i) => {
        return {
          ip: v,
          type: types[i],
          latency: latencies[i]
        };
      });
    });
    const filtered = proxies
      .filter(v => v.type.startsWith("HTTP"))
      .sort((p, c) => p.latency - c.latency);
    await Promise.all(
      filtered.map(async v => {
        return db.Proxy.upsert({
          // 있는경우에는 수정, 없는경우에는 만듦
          ip: v.ip,
          type: v.type,
          latency: v.latency
        });
      })
    );
    await page.close();
    await browser.close();
    const fastestProxy = await db.Proxy.findOne({
      order: [["latency", "ASC"]]
    });
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--window-size=1920,1080",
        "--disable-notifications",
        `--proxy-server=${fastestProxy.ip}`,
        "--ignore-certificate-errors"
      ]
    });
    // const context1 = await browser.createIncognitoBrowserContext(); // 시크릿창
    // const context2 = await browser.createIncognitoBrowserContext();
    // const context3 = await browser.createIncognitoBrowserContext();
    // const page1 = await context1.newPage();
    // const page2 = await context2.newPage();
    // const page3 = await context3.newPage();
    // await page1.goto("");
    // await page2.goto("");
    // await page3.goto("");
    page = await browser.newPage();
    await page.goto(
      "https://search.naver.com/search.naver?sm=top_hty&fbm=0&ie=utf8&query=%EB%82%B4+ip"
    );
    await page.waitFor(10000);
    await page.close();
    await browser.close();
    await db.sequelize.close();
  } catch (e) {
    console.error(e);
  }
};

crawler();
