const request = require("request");
const cheerio = require("cheerio");
const csvWriter = require('csv-write-stream');
const fs = require("fs");
const readline = require('readline');

const carArray = [
    {brand : "ALFA ROMEO", model: "GIULIETTA"},
    {brand : "BMW", model: "SERIE 1"},
    {brand: "MAZDA", model :"3"},
    {brand: "MERCEDES", model: "CLASSE A"},
    {brand: "VOLKSWAGEN", model: "GOLF"},
    {brand: "AUDI", model: "A1"},
    {brand: "VOLVO", model:"V40"}
]


let page = 1;
//default config
let priceMax = 18000;
let yearMin = 2016;
let mileageMax = 50000;
let energies = 'ess,hyb';
let regions = "FR-PAC,FR-NAQ"

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

buildURL = (brand, model) => {
    let res =  encodeURI(`https://www.lacentrale.fr/listing?makesModelsCommercialNames=${brand}$$${model}&priceMax=${priceMax}&mileageMax=${mileageMax}&yearMin=${yearMin}&page=${page}&energies=${energies}&regions=${regions}`);
    return res.replace('$$', encodeURIComponent(':'));

    
};


strToNumber = (str) => {
    let res = "";
    for(let s of str){
        if(Number(s) || s==='0'){
            res += s;
        }

    }
    return res;
}

parseNumPage = (html) => {
    const $ = cheerio.load(html);
    let res = $('.numAnn').get(0);
    return Math.ceil(res.firstChild.data / 10);
}

parseHTML = (html, brand, carModel) => {
    const $ = cheerio.load(html);
    let res = $('.subContRight').toArray();
    let resArray = [];

    res.map(item => {
            let model = item.children[0].children[1].lastChild.data;
            let price = strToNumber(item.children[2].children[1].lastChild.lastChild.lastChild.lastChild.data);
            let km = strToNumber(item.children[2].children[1].children[1].firstChild.data);
            let departement =  item.children[1].children[1].children[0].children[3].data;
            let year  = item.children[2].children[1].firstChild.firstChild.data;
            let link = "https://www.lacentrale.fr"+ item.parent.parent.attribs.href;

            

            

            resArray.push({model: model, departement: departement, price: price, km: km, year: year, link: link})

    })


    return resArray;
};


writeDocument = async (dataToWrite, brand, model) => {
    if(dataToWrite.length > 0 ){
        let fileName = brand+' '+model+'.csv';
        var writer;
        if (!fs.existsSync(fileName))
            writer = csvWriter({headers: ["model", "departement","price","km","year","link"]});
        else
            writer = csvWriter({sendHeaders: false});
        writer.pipe(fs.createWriteStream(fileName, {flags: 'a'}));
        for(let elem of dataToWrite){
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


chooseParams = async () => {
  

        let priceMaxReturned = await question('Max price : ');
        if(Number(priceMaxReturned)){
            priceMax = priceMaxReturned;
        }else{
            console.log("error that is not a number : "+priceMaxReturned);
            return;
        }

        let minYearReturned  = await question('Min year : ');
        if(Number(minYearReturned)){
            yearMin = minYearReturned;
        }else{
            console.log("error that is not a number : "+minYearReturned);
            return;
        }
        
        let maxKmReturned = await question('Max km : ');
        if(Number(maxKmReturned)){
            mileageMax = maxKmReturned;
        }else{
            console.log("error that is not a number : "+maxKmReturned);
            return;
        }
        
        console.log("New parameters :" );
        console.log("- Max price : "+priceMax);
        console.log("- Min year : "+yearMin)
        console.log("- Max km : "+mileageMax);

};


initMain = async () => {
    console.log("Default parameters :" );
    console.log("- Max price : "+priceMax);
    console.log("- Min year : "+yearMin)
    console.log("- Max km : "+mileageMax);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    return new Promise((resolve, reject) => { 
        rl.question('Press 1 to use default params, press 2 to choose your params : ', async (answer) => {
            switch (answer){
                case '1':
                    console.log('Default config used.');
                    rl.close();
                    resolve();
                    break;
                case '2':
                    rl.close();
                    await chooseParams();
                    resolve();
                    break;
                default:
                    console.log('Default config used.');
                    rl.close();
                    resolve();
                    break;
            }      
        });
    });
};


main = async () => {
    let resArray = [];
    await initMain();
    console.log("Please wait parsing in progress...")
    for(let elem of carArray){
        page = 1;
        let maxPage = 1;
        for(let i = 1; i <= maxPage; i++){
            let URL =  buildURL(elem.brand, elem.model);
            let body = await doRequest(URL).catch(err => console.error("### Lacentrale website structure has changed ###"));
            maxPage = parseNumPage(body);
            resArray.push({brand: elem.brand, model : elem.model, cars : parseHTML(body,elem.brand, elem.model)});
            page += 1;
        };
        console.log(maxPage + " page parsed for "+ elem.brand +' '+elem.model);
    }

    //write in the excel file
    for(let e of resArray){
        await writeDocument(e.cars, e.brand, e.model)
    }
}

main();




