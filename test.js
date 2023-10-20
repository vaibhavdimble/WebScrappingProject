const puppeteer = require("puppeteer");
const { PrismaClient } = require("@prisma/client");

async function parseNoBrokerSwargate() {
  // Launch the browser
  const browser = await puppeteer.launch();

  // Open a new tab
  const page = await browser.newPage();

  // URL for Swargate in Pune
  const swargateURL =
    "https://www.nobroker.in/property/sale/pune/Pimpri-Chinchwad?searchParam=W3sibGF0IjoxOC42Mjk3ODExLCJsb24iOjczLjc5OTcwOTQsInBsYWNlSWQiOiJDaElKcy1xOWZ6ZTR3anNSLUtDbnNkcGxRaXciLCJwbGFjZU5hbWUiOiJQaW1wcmktQ2hpbmNod2FkIn1d&radius=2.0&city=pune&locality=Pimpri-Chinchwad";

  // Visit the Swargate page and wait until network connections are completed
  await page.goto(swargateURL, { waitUntil: "networkidle2" } 
  );

  // Interact with the DOM to retrieve the titles
  const titles = await page.evaluate(() => {
    // Select all elements with crayons-tag class
    return [
      ...document.querySelectorAll(
        ".infinite-scroll-component .nb__7nqQI .border-cardbordercolor #minDeposit"
      ),
    ].map((el) => el.textContent.trim());
  });
//For bhk Data here
  const bhk = await page.evaluate(() => {
    // Select all elements with crayons-tag class
    return [
      ...document.querySelectorAll(
        "[class=font-semibold]"
      ),
    ].map((el) => el.textContent.trim());
  });
  // console.log(bhk);
  const bhkData = bhk.filter(item => item.includes('1 BHK') || item.includes('2 BHK') || item.includes('3 BHK'));
// console.log(bhkData);




  // Don't forget to close the browser instance to clean up the memory
  await browser.close();
  const extractedPrices = titles.map((text) => {
    const matchLacs = text.match(/₹([\d.]+) Lacs/);
    const matchCrores = text.match(/₹([\d.]+) Crores/);

    if (matchLacs) {
      return matchLacs[1] + " Lacs";
    } else if (matchCrores) {
      return matchCrores[1] + " Crores";
    } else {
      return null;
    }
  });

  console.log(extractedPrices);
 



  function convertLakhOrCroreStringToNumber(valueString) {
    if (!valueString) {
      return null; // Handle null or undefined values
    }

    // Check if the string contains 'Lacs' or 'Crores' and perform the conversion
    if (valueString.includes("Lacs")) {
      const numericValue = parseFloat(valueString.replace(/[^\d.]/g, ""));
      if (!isNaN(numericValue)) {
        return numericValue * 100000; // 1 Lakh = 100,000
      }
    } else if (valueString.includes("Crores")) {
      const numericValue = parseFloat(valueString.replace(/[^\d.]/g, ""));
      if (!isNaN(numericValue)) {
        return numericValue * 10000000; // 1 Crore = 10,000,000
      }
    }

    return null; // Return null for unrecognized formats
  }

  function formatPriceWithUnits(price) {
    if (price >= 10000000) {
      // If the price is 1 crore or more, display it in crores
      return `${(price / 10000000).toFixed(2)} crores`;
    } else if (price >= 100000) {
      // If the price is 1 lakh or more, display it in lakhs
      return `${(price / 100000).toFixed(2)} lakhs`;
    } else {
      // Otherwise, display it in raw numbers
      return price.toString();
    }
  }

  // Convert the array values to numeric prices
  // const numericPrices = extractedPrices.map(convertLakhOrCroreStringToNumber).filter(price => price !== null);
  const numericPrices = extractedPrices
  .map(convertLakhOrCroreStringToNumber)
  .filter(price => price !== null)
  .map(price => parseInt(price)); // Convert to integers

console.log(numericPrices);
 // mering two arrays into objects
 const totaldata = {};

 if (titles.length === bhkData.length) {
   for (let i = 0; i < titles.length; i++) {
     totaldata[numericPrices[i]] = bhkData[i];
   }
 }
 console.log(totaldata);



  // Calculate the average price
  const avePrice =
    numericPrices.reduce((sum, price) => sum + price, 0) / numericPrices.length;
  // Calculate the maximum price
  const maxiPrice = Math.max(...numericPrices);

  // Calculate the minimum price
  const minPrice = Math.min(...numericPrices);  

   const averagePrice = formatPriceWithUnits(avePrice);
    const maximumPrice = formatPriceWithUnits(maxiPrice);
    const minimumPrice = formatPriceWithUnits(minPrice);

  console.log("Average"+averagePrice);
  console.log("Maximum"+ maximumPrice +"   Minimum"+ minimumPrice);

  const prisma = new PrismaClient();

  try {
    // Store data in the database
    const property = await prisma.propertydata.create({
      data: {
        // Other property data...
        averagePrice,
        minimumPrice,
        maximumPrice,
        areaName :"test",
       
      },
    });

    console.log("Data stored in the database:", property);
  } catch (error) {
    console.error("Error storing data in the database:", error);
  } finally {
    // Close the Prisma client
    await prisma.$disconnect();
  }

}
parseNoBrokerSwargate();
