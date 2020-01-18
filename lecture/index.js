const xlsx = require("xlsx");

const workbook = xlsx.readFile("xlsx/data.xlsx");

const ws = workbook.Sheets.영화목록;

const records = xlsx.utils.sheet_to_json(ws);

/* for (const [i, r] of records.entries()) { // 배열.entries()를 쓰면 내부 배열이  [인덱스, 값] 모양 이터레이터로 바뀜
  console.log(i, r.제목, r.링크);
} */

records.forEach((r, i) => {
  console.log(i, r.제목, r.링크);
});
