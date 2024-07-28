const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const chapterData = [];

  await page.goto("https://arulvakku.com/toc.php");

  const container = await page.$(
    ".container:nth-of-type(3) .row .col-sm-12 .chapters:nth-of-type(1)"
  );

  if (!container) {
    console.error("No Chapter Found");
    await browser.close();
    return;
  }

  // Authority links
  const authorityLinks = await container.$$eval(".num", (elements) =>
    elements.map((el) => el.href)
  );

  // Chapter heading
  const chapterHeading = await container.$eval("a:nth-of-type(1)", (element) => element.innerText);
  console.log(chapterHeading);

  for (let i = 0; i < authorityLinks.length; i++) {
    
    await page.goto(authorityLinks[i]);
    
    const data = await page.evaluate(async () => {
      let data = {};

      const headElement = document.querySelector("h1");
      data.head = headElement ? headElement.innerText : "No heading found";

      const audioElement = document.querySelector("audio");
      data.audio = audioElement ? audioElement.src : "No audio found";

      data.biblecontent = [];

      let verseEls = document.querySelectorAll(".biblecontent .para");

      verseEls.forEach((verseEl) => {
        let verseList = verseEl.querySelectorAll(".verse");
        verseList.forEach((el) => {
          let verseNumElement = el.querySelector(".verseNum");
          let verseNum = verseNumElement ? verseNumElement.innerText : "No verse number";
          let verse = el.innerText
            .slice(el.innerText.indexOf(" ") + 1)
            .trim()
            .replace(/\n\+?/g, "");
          data.biblecontent.push({ verseNum, verse });
        });
      });

      return data;
    }).catch(err => {
      console.error(`Error extracting data from ${authorityLinks[i]}:`, err);
      return null;
    });

    if (data) {
      chapterData.push(data);
    }
  }

  console.log(chapterData);

  // Save the data to a JSON file
  fs.writeFile(`${chapterHeading}.json`, JSON.stringify(chapterData, null, 2), (err) => {
    if (err) {
      console.error("Error writing file", err);
    } else {
      console.log("File written successfully");
    }
  });

  await browser.close();
})();


/*
const puppeteer = require("puppeteer");

//convert key value for verse
const convertToKeyValue = (arr) => {
  const keyValuePairs = {};
  for (let i = 0; i < arr.length; i++) {
    const currentElement = arr[i];
    const nextElement = arr[i + 1];
    // Check if the current element is a string representation of a number
    if (!isNaN(parseInt(currentElement))) {
      // Use the current element as the key and the next element as the value
      keyValuePairs[currentElement] = nextElement;
    }
  }
  return keyValuePairs;
};

async function GetBibleData() {
  const USERNAME = "vpn";
  const PASSWORD = "vpn";
  const PROXY_SERVER_ADDRESS = "vpn482495676.opengw.net";
  const PORT = "your_proxy_port";

  const browser = await puppeteer.launch({ headless: false});
  const page = await browser.newPage();

  await page.goto("https://bible.catholicgallery.org/tamil/etb-genesis-1/");

  //selector
  let pageNoSelector = await page.$$eval("#bibtop a", (el) =>
    el.map((no) => no.innerText)
  );
  let pageBtnEl = await page.$$eval("#bibtop a", (el) => el.map((x) => x.href));

  //answers
  let pageNo = await Number(pageNoSelector[pageNoSelector.length - 2]); //last authority number
  let commanLink = pageBtnEl[0]; //link string
  

  for (let i = 0; i < 1; i++) {
    let data = [];
    let authorityNo = i + 1;
    let pageLink = `${commanLink.split("-")[0]}-${commanLink.split("-")[1]}-${i}/`;
    let audioLink = await page.$eval(".abdlbtnsty a", (el) => el.href);

    await page.goto(pageLink);
    const children = await page.evaluate(() => {
      const parentElement = document.querySelector(".contentstyle");
      if (parentElement) {
        return Array.from(parentElement.children).map((child) => {
          return {
            className: child.className,
            textContent: child.innerText.replace(/\n\s*\n/g, ""),
          };
        });
      } else {
        return null;
      }
    });


    children.map((el) => {
      
        switch (el.className) {
        
        case "cg_subhdg":
          data.push({ subhead: el.textContent });
          break;

        case "cgpara":
          let paragraph = el.textContent;
          let filPara = paragraph
            .split(/(-?\d+)/g)
            .filter((str) => str.trim() != "");
          const keyValuePairs = convertToKeyValue(filPara);
          data.push(keyValuePairs);
          break;

        case "cgcrossref":
          data.push({ crossref: el.textContent });
          break;

        case "copyrstyle":
          data.push({ croddsecref: el.textContent });
          break;
        
          case "cgfootnote":
          data.push({cgfootnote:el.textContent.replace(/\n|\+/g, '')});

        default:
          break;
      }
    });

    data.push({ audioLink: audioLink });

    const mergedData = [];
    let tempObj = {};

    data.forEach((obj) => {
      if (obj.hasOwnProperty("subhead")) {
        if (Object.keys(tempObj).length !== 0) {
          mergedData.push(tempObj);
          tempObj = {};
        }
        mergedData.push(obj);
      } else {
        Object.assign(tempObj, obj);
      }
    });
    if (Object.keys(tempObj).length !== 0) {
      mergedData.push(tempObj);
    }
    console.log({[`Genesis${pageNo}`]: mergedData}); //finally i get the data
  }

}

GetBibleData();//scraping data method 
*/

/*
const puppeteer = require("puppeteer");
const fs = require('fs');

async function GetBibleData() {

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://arulvakku.com/toc.php");

  const container = await page.$(
    ".container:nth-of-type(3) .row .col-sm-12 .chapters:nth-of-type(1)"
  );

  // chapter container
  const chaptersContainer = container
    ? await container.evaluate((element) => element.outerHTML)
    : "No Cheapter Found";

  // authority links
  const authorityLinks = container
    ? await container.$$eval(".num", (elements) =>
        elements.map((el) => el.href)
      )
    : "No Authority Found";
    
  // chapter heading [i]
  const chapterHeading = container
    ? await container.$eval("a:nth-of-type(1)", (element) => element.innerText)
    : "No Chapter Heading Found";

    const Datas = []
  //loop start
  for(let i = 0 ; i < authorityLinks.length; i++){
  // start the proccess for scraping bible
  let firstChapterLink =
    container && authorityLinks.length > 0
      ? await page.goto(authorityLinks[i])
      : "No link Found";

  let chapterNumber = authorityLinks[i].split("ch=")[1];

  // authority 1 [ii]
  let chapterSubHeads = chapterHeading + " " + chapterNumber;

  const pageContainer = await page.$(".container:nth-of-type(3)");

  // audio autority [iii]
  let audioBible = pageContainer
    ? await pageContainer.$eval(
        "#chapterHeader .chapterNavMiddle audio",
        (el) => el.src
      )
    : "Not Found";

  const pageVerseContainer = pageContainer
    ? await pageContainer.$$eval(".biblecontent", (el) =>
        el.map((el) => el.outerHTML)
      )
    : "Not Found";
  await page.setContent(pageVerseContainer);

  // Extract data
  const data = await page.evaluate(() => {
    const results = [];
    
    const headings = document.querySelectorAll("h3");

    headings.forEach((heading) => {
      const subheading = heading.innerText;
      const verses = [];
      // Get the next sibling element until another h3 or the end of container
      let next = heading.nextElementSibling;
      while (next && next.tagName !== "H3") {
        if (next.classList.contains("para")) {
          const verseElements = next.querySelectorAll(".verse");
          verseElements.forEach((verseElement) => {
            const verseno = verseElement.querySelector(".verseNum").innerText;
            const verseText = verseElement.innerText
              .replace(verseno, "")
              .trim();
            verses.push({
              verseno: parseInt(verseno),
              verse: verseText,
            });
          });
        }
        next = next.nextElementSibling;
      }
      results.push({ subheading, verses});
    });

    return results;
   
  });

  // Format the data to match the desired JSON structure
  const formattedData = data.map((item,i) => {
    const formattedItem = { subheading: item.subheading,audio: audioBible };
    item.verses.forEach((verse, index) => {
      formattedItem[`verse${index + 1}`] = {
        verseno: index + 1,
        verse: verse.verse,
      };
    });
    return formattedItem;
  });

  // Output the formatted data
  console.log(JSON.stringify(formattedData, null, 2));
  Datas.push({[`${chapterSubHeads}`]:formattedData});
}// loop end

fs.writeFile('output.json', JSON.stringify(Datas, null, 2), (err) => {
  if (err) throw err;
  console.log('Data has been saved to output.json');
});

}

GetBibleData();*/

// const puppeteer = require("puppeteer");
// const fs = require("fs");

// (async () => {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();
  
//   const chapterData =[];

//   await page.goto("https://arulvakku.com/toc.php");

//   const container = await page.$(
//     ".container:nth-of-type(3) .row .col-sm-12 .chapters:nth-of-type(1)"
//   );

//   // chapter container
//   const chaptersContainer = container
//     ? await container.evaluate((element) => element.outerHTML)
//     : "No Cheapter Found";

//   // authority links
//   const authorityLinks = container
//     ? await container.$$eval(".num", (elements) =>
//         elements.map((el) => el.href)
//       )
//     : "No Authority Found";
    
//   // chapter heading [i]
//   const chapterHeading = container
//     ? await container.$eval("a:nth-of-type(1)", (element) => element.innerText)
//     : "No Chapter Heading Found";

//     console.log(chapterHeading);

//     for(let i = 0 ; i < 2; i++){
      
//       let firstChapterLink = container && authorityLinks.length > 0 ? await page.goto(authorityLinks[i]) : "No link Found";
    
//       await page.evaluate(() => {
    
//         let data = {};
    
//         data.head = document.querySelector("h1").innerText; // head
//         data.audio = document.querySelector("audio").src; // audio link
    
//         data.biblecontent = [];
    
//         let verseEls = document.querySelectorAll(".biblecontent .para");
    
//         verseEls.forEach((verseEl) => {
//           let verseList = verseEl.querySelectorAll(".verse");
//           verseList.forEach((el) => {
//             let verseNum = el.querySelector(".verseNum").innerText;
//             let verse = el.innerText
//               .slice(el.innerText.indexOf(" ") + 1)
//               .trim()
//               .replace(/\n\+?/g, "");
//             data.biblecontent.push({ verseNum, verse });
//           });
//         });
//         chapterData.push(data);
//         //return data;
//       });
//     }

//     console.log(chapterData);
/*
  const chapter = await page.evaluate(() => {
    
    let data = {};

    data.head = document.querySelector("h1").innerText; // head
    data.audio = document.querySelector("audio").src; // audio link

    data.biblecontent = [];

    let verseEls = document.querySelectorAll(".biblecontent .para");

    verseEls.forEach((verseEl) => {
      let verseList = verseEl.querySelectorAll(".verse");
      verseList.forEach((el) => {
        let verseNum = el.querySelector(".verseNum").innerText;
        let verse = el.innerText
          .slice(el.innerText.indexOf(" ") + 1)
          .trim()
          .replace(/\n\+?/g, "");
        data.biblecontent.push({ verseNum, verse });
      });
    });
    chapterData.push(data);
    //return data;
  });*/


//  const jsonData = JSON.stringify(chapter, null, 2);

//  fs.writeFile("chapter.json", jsonData, (err) => {
//    if (err) {
//      console.error("Error writing file", err);
//    } else {
//      console.log("File written successfully");
//    }
//  });

  //await browser.close();
//})();