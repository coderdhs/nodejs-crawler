const xlsx = require("xlsx");
const axios = require("axios"); // ajax 라이브러리 : html 요청
const cheerio = require("cheerio"); // html 파싱
const add_to_sheet = require("./add_to_sheet");

const workbook = xlsx.readFile("xlsx/data.xlsx");
const ws = workbook.Sheets.영화목록;
const records = xlsx.utils.sheet_to_json(ws);

/* for (const [i, r] of records.entries()) {
  console.log(i, r.제목, r.링크);
} */

// console.log(records);

const crawler = async () => {
  add_to_sheet(ws, "C1", "s", "평점");
  for (const [i, r] of records.entries()) {
    // 순서를 보장. 속도느림.
    const response = await axios.get(r.링크);
    if (response.status === 200) {
      // 응답이 성공한 경우
      const html = response.data;
      // console.log(html);
      const $ = cheerio.load(html);
      const text = $(".score.score_left .star_score").text();
      console.log(r.제목, "평점", text.trim());
      const newCell = "C" + (i + 2);
      add_to_sheet(ws, newCell, "n", parseFloat(text.trim()));
    }
  }
  xlsx.writeFile(workbook, "xlsx/result.xlsx");
  /*   await Promise.all( // 순서를 보장하지 않음. 속도빠름.
    records.map(async r => {
      const response = await axios.get(r.링크);
      if (response.status === 200) {
        // 응답이 성공한 경우
        const html = response.data;
        // console.log(html);
        const $ = cheerio.load(html);
        const text = $(".score.score_left .star_score").text();
        console.log(r.제목, "평점", text.trim());
      }
    })
  ); */
};

crawler();
