const puppeteer = require("puppeteer");
const dotenv = require("dotenv");

const db = require("./models");
dotenv.config();

const crawler = async () => {
  try {
    await db.sequelize.sync(); // 크롤러 돌리면서 디비연결
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--window-size=1920,1080", "--disable-notifications"],
      userDataDir: "C:Users//fence//AppData//Local//Google//Chrome//User Data" // login 정보를 저장
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.goto("http://instagram.com");
    if (await page.$('a[href="/coderdhs/"]')) {
      console.log("already logined");
    } else {
      await page.waitForSelector("button.L3NKy"); // facebook으로 login
      await page.click("button.L3NKy");
      await page.waitForNavigation(); // facebook login으로 넘어가는 것을 기다림
      await page.waitForSelector("#email");
      await page.waitForSelector("#pass");
      await page.type("#email", process.env.EMAIL);
      await page.type("#pass", process.env.PASSWORD);
      await page.waitForSelector("#loginbutton");
      await page.click("#loginbutton");
      await page.waitForNavigation();
    }

    // await page.waitForSelector(
    //   "#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.LWmhU._0aCwM > input"
    // );
    // await page.click(
    //   "#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.LWmhU._0aCwM > input"
    // );
    // await page.keyboard.type("dog");
    // await page.waitForSelector(".drKGC");
    // const href = await page.evaluate(() => {
    //   return document.querySelector(".drKGC a:first-child").href;
    // });
    // await page.goto(href);

    let result = [];
    let prevPostId = "";
    while (result.length < 10) {
      const moreButton = await page.$("button.sXUSN");
      if (moreButton) {
        await page.evaluate(btn => btn.click(), moreButton);
      }
      const newPost = await page.evaluate(() => {
        const article = document.querySelector("article:first-child");
        const postId =
          article.querySelector(".c-Yi7") &&
          article
            .querySelector(".c-Yi7")
            .href.split("/")
            .slice(-2, -1)[0];
        const name = article.querySelector("h2") && article.querySelector("h2").textContent;
        const img = article.querySelector(".KL4Bh img") && article.querySelector(".KL4Bh img").src;
        const content =
          article.querySelector("._4EzTm.pjcA_ > div > span > span:nth-child(1)") &&
          article.querySelector("._4EzTm.pjcA_ > div > span > span:nth-child(1)").textContent;
        const commentsTags = article.querySelectorAll(
          "div.Igw0E.IwRSH.eGOV_._4EzTm.XfCBB > div:nth-child(2) > div:not(:first-child) > div"
        );
        let comments = [];
        commentsTags.forEach(c => {
          const name = c.querySelector("a") && c.querySelector("a").textContent;
          const comment = c.querySelector("span") && c.querySelector("span").textContent;
          comments.push({
            name,
            comment
          });
        });
        return {
          postId,
          name,
          content,
          img,
          comments
        };
      });
      if (newPost.postId !== prevPostId) {
        if (!result.find(v => v.postId === newPost.postId)) {
          const exist = await db.Instagram.findOne({
            where: {
              postId: newPost.postId
            }
          });
          if (!exist) {
            result.push(newPost);
            console.log(newPost);
          }
        }
      }
      await page.waitFor(500);
      await page.evaluate(() => {
        const heartBtn = document.querySelector("article:first-child button.wpO6b");
        const heartSvg = heartBtn.querySelector("svg");
        if (heartSvg && heartSvg.getAttribute("fill") === "#262626") {
          heartBtn.click();
        }
      });
      await page.waitFor(500);
      prevPostId = newPost.postId;
      await page.evaluate(() => {
        window.scrollBy(0, 800);
      });
    } // while끝

    await Promise.all(
      result.map(r => {
        return db.Instagram.create({
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
