const puppeteer = require("puppeteer");
const dotenv = require("dotenv");

const db = require("./models");
dotenv.config();

const crawler = async () => {
  try {
    await db.sequelize.sync(); // 크롤러 돌리면서 디비연결
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--window-size=1920,1080", "--disable-notifications"]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.goto("http://facebook.com");
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    await page.type("#email", email);
    await page.type("#pass", password);
    await page.waitFor(1000);
    await page.click("#loginbutton");
    await page.waitForResponse(response => {
      return response.url().includes("login_attempt");
    });
    await page.keyboard.press("Escape");
    await page.waitForSelector("textarea");
    await page.click("textarea");
    await page.waitForSelector("._5rpb");
    await page.click("._5rpb");
    await page.keyboard.type("test..");
    await page.waitForSelector("._69yt  button");
    await page.waitFor(5000);
    await page.click("._69yt  button");
    let result = [];
    //    while (result.length < 10) {
    await page.waitForSelector("[id^=hyperfeed_story_id]:first-child"); // hyperfeed_story_id로 시작하는 id, $=, ~= 등도 있음?
    await page.waitFor(5000);
    const newPost = await page.evaluate(() => {
      window.scrollTo(0, 0);
      const firstFeed = document.querySelector("[id^=hyperfeed_story_id]:first-child");
      const name = firstFeed.querySelector("h5") && firstFeed.querySelector("h5").textContent;
      const content =
        firstFeed.querySelector(".userContent") &&
        firstFeed.querySelector(".userContent").textContent;
      const img = firstFeed.querySelector(".mtm img") && firstFeed.querySelector(".mtm img").src;
      const postId = firstFeed.id.split("_").slice(-1)[0]; //배열에서 마지막 고르기
      return {
        name,
        content,
        img,
        postId
      };
    });
    const exist = await db.Facebook.findOne({
      where: {
        writer: newPost.name,
        content: newPost.content
      }
    });
    if (!exist) {
      result.push(newPost);
    }
    const likeBtn = await page.$("[id^=hyperfeed_story_id]:first-child ._666k a");
    await page.evaluate(like => {
      const sponsor = document
        .querySelector("[id^=hyperfeed_story_id]:first-child")
        .textContent.includes("SpSpSononSsosoSredredSSS");
      if (!sponsor && like.getAttribute("aria-pressed") === "false") {
        // 속성을 가져옴
        like.click();
      } else if (sponsor && like.getAttribute("aria-pressed") === "true") {
        like.click();
      }
    }, likeBtn);
    await page.waitFor(1000);
    await page.evaluate(() => {
      const firstFeed = document.querySelector("[id^=hyperfeed_story_id]:first-child");
      firstFeed.parentNode.removeChild(firstFeed);
      window.scrollBy(0, 200);
    });
    await page.waitFor(1000);
    //    }
    await Promise.all(
      result.map(r => {
        return db.Facebook.create({
          postId: r.postId,
          media: r.img,
          writer: r.name,
          content: r.content
        });
      })
    );
    await page.close();
    await browser.close();
    await db.sequelize.close();
  } catch (e) {
    console.error(e);
  }
};

crawler();
