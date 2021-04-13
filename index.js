const request = require("request");
const cheerio = require("cheerio");
const csvWriter = require('csv-write-stream');
const fs = require("fs");
const readline = require('readline');


const defaultConfig = {
    priceMax: 20000,
    yearMin: 2015,
    mileageMax: 75000,
    energies: 'ess,hyb',
    regions: "FR-PAC,FR-NAQ",
    powerDINMin: 0
}

const carArray = [
    { ...defaultConfig, brand: "ALFA ROMEO", model: "GIULIETTA", powerDINMin: 200},
    // {brand: "BMW", model: "SERIE 1"},
    // {brand: "MAZDA", model: "3"},
    // {brand: "MERCEDES", model: "CLASSE A"},
    { ...defaultConfig, brand: "VOLKSWAGEN", model: "GOLF", energies: 'hyb'},
    // {brand: "AUDI", model: "A1"},
    // {brand: "VOLVO", model: "V40"}
]



let page = 1;

doRequest = (url) => {
    return new Promise(function (resolve, reject) {
        request(url, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

buildURL = (car) => {
    let res = encodeURI(`https://www.lacentrale.fr/listing?makesModelsCommercialNames=${car.brand}$$${car.model}&priceMax=${car.priceMax}&mileageMax=${car.mileageMax}&yearMin=${car.yearMin}&page=${car.page}&energies=${car.energies}&regions=${car.regions}&powerDINMin=${car.powerDINMin}`);
    return res.replace('$$', encodeURIComponent(':'));


};


strToNumber = (str = '') => {
    let result = "";
    str.split('').forEach(value => {
            if (Number(value) || value === '0') {
                result += value;
            }
        }
    )
    return result;
}

parseNumPage = (html) => {
    const $ = cheerio.load(html);
    let res = $('.numAnn').get(0);
    return Math.ceil(res.firstChild.data / 10);
}

parseHTML = (html, brand, carModel) => {
    const $ = cheerio.load(html);
    let res = $('.searchCard__rightContainer').toArray();
    let resArray = [];

    res.map(item => {
        let model = item.children[0].children[1].lastChild.data;
        let price = strToNumber(item.children[1].children[0].children[0].children[0].children[0].data);
        let km = strToNumber(item.lastChild.lastChild.lastChild.lastChild.data);
        let departement = item.children[2].children[1].children[0].children[0].data;
        let year = item.lastChild.children[2].lastChild.lastChild.data;
        let link = "https://www.lacentrale.fr" + item.parent.parent.attribs.href;


        resArray.push({model: model, departement: departement, price: price, km: km, year: year, link: link})

    })


    return resArray;
};


writeDocument = async (dataToWrite, brand, model) => {
    if (dataToWrite.length > 0) {
        let fileName = brand + ' ' + model + '.csv';
        var writer;
        if (!fs.existsSync(fileName))
            writer = csvWriter({headers: ["model", "departement", "price", "km", "year", "link"]});
        else
            writer = csvWriter({sendHeaders: false});
        writer.pipe(fs.createWriteStream(fileName, {flags: 'a'}));
        for (let elem of dataToWrite) {
            writer.write(elem);
        }
        writer.end()
    }
}

question = (question) => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}


main = async () => {
    let resArray = [];
    console.log("Please wait parsing in progress...")
    for (let elem of carArray) {
        page = 1;
        let maxPage = 1;
        for (let i = 1; i <= maxPage; i++) {
            let URL = buildURL(elem);
            let body = await doRequest(URL).catch(err => console.error("### Lacentrale website structure has changed ###"));
            maxPage = parseNumPage(body);
            resArray.push({brand: elem.brand, model: elem.model, cars: parseHTML(body, elem.brand, elem.model)});
            page += 1;
        }
        ;
        console.log(maxPage + " page parsed for " + elem.brand + ' ' + elem.model);
    }

    //write in the excel file
    for (let e of resArray) {
        await writeDocument(e.cars, e.brand, e.model)
    }
}

main();




