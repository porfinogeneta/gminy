const unirest = require("unirest");
const cheerio = require("cheerio");

const {promises: fsPromises} = require('fs');
const Diacritics = require('diacritic');

// getting list of gminy in a google-friendly format
const getGminy = async () => {
    try {
        const data = await fsPromises.readFile("./dane.txt")
        const content = await Diacritics.clean(data.toString().toLowerCase().replace(/ /g, '+')).split(/\r?\n/)

        // console.log(content)
        return content
    }catch (err){
        console.log(err)
        return err
    }

}


// searching for contacts in a given gmina
const getOrganicData = (name) => {
        return unirest
            .get(`https://search.yahoo.com/search;_ylt=AwrNaxmdZINjD2gEPj9XNyoA;_ylc=X1MDMjc2NjY3OQRfcgMyBGZyA3NmcARmcjIDc2ItdG9wBGdwcmlkA1BXQkJJRURtUUYyejlyalBRUTFueEEEbl9yc2x0AzAEbl9zdWdnAzAEb3JpZ2luA3NlYXJjaC55YWhvby5jb20EcG9zAzAEcHFzdHIDBHBxc3RybAMwBHFzdHJsAzM2BHF1ZXJ5A2tvbnRha3QlMjBnbWluYSUyMG9zaWVjem5pY2ElMjBpbmZvcm1hdHlrYQR0X3N0bXADMTY2OTU1NTM4MA--?p=kontakt+gmina+${name}+informatyka&fr2=sb-top&fr=sfp`)
            .headers({
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36",
            })
            .then((response) => {
                return new Promise((resolve, reject) => {
                    if (!response){
                        reject(response)
                    }
                    let $ = cheerio.load(response.body);
                    // let title;
                    let link;

                    // title = $(".yuRUbf > a > h3").text();
                    link = $(".title > a").attr("href");
                    resolve(link)
                })

            });
};

// minimal args for optimazing
const minimal_args = [
    '--autoplay-policy=user-gesture-required',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-domain-reliability',
    '--disable-extensions',
    '--disable-features=AudioServiceOutOfProcess',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-notifications',
    '--disable-offer-store-unmasked-wallet-cards',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-setuid-sandbox',
    '--disable-speech-api',
    '--disable-sync',
    '--hide-scrollbars',
    '--ignore-gpu-blacklist',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--no-zygote',
    '--password-store=basic',
    '--use-gl=swiftshader',
    '--use-mock-keychain',
];

// getting data of interest
const puppeteer = require('puppeteer');
const getData = async (LIN, name) => {
        try {
            const browser = await puppeteer.launch({ headless: true, args: minimal_args, defaultViewport: null });
            const [page] = await browser.pages();
            // disable css and JS and images
            page.setRequestInterception(true);
            page.on('request', (req) => {
                if(req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font' || req.resourceType() === 'script'){
                    req.abort();
                }
                else {
                    req.continue();
                }
            });
            // to gmina website
            await page.goto(LIN)
            const t = 'informat'
            const content = await page.$eval('*', el => (el.innerText).replace(/\s+/g, ' ').trim());
            const index_infor = content.toLowerCase().indexOf(t)
            const result = content.slice(index_infor - 100, index_infor + 100)
            if (result) {
                return new Promise(resolve => resolve(result))
            }
            return {
                name,
                link: LIN,
                data: result
            }
            // console.log(content)

        } catch (err) {
            console.error(err);
        }
};

// function to retrieve all links for gminas from google
const getAllLinks = async (gminy) => {
    const urls = []
    const promises = []
    gminy.forEach(gmina => {
        promises.push(getOrganicData(gmina))
    })
    Promise.allSettled(promises)
        .then((values) => {
            values.forEach(value => {
                console.log(`'${value.value}',`)
            })
    })
    return urls
}



const main = async () => {
    const wholesome_data = []
    const links = []
    const gminy = await getGminy()
    // getAllLinks(gminy)
    const promises = []
    for (let i = 0; i < 150; i++){
        const LIN = linki[i]
        if (LIN !== 'undefined'){
            promises.push(getData(LIN, gminy[i]))
        }else {
            wholesome_data.push({
                name: gminy[i],
                data: null,
                link: null
            })
        }
    }
    // console.log(promises)
    Promise.allSettled(promises)
        .then((values) => {
            // console.log(values)
            // values.forEach(value => {
            //     console.log(
            //         `name: ${value.value.name},
            //         link: ${value.value.link},
            //         data: ${value.value.data},`
            //     )
            // })
            console.log(values)
        })
    console.log(wholesome_data)
    return 0;
}

main()

