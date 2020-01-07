/*
Copyright (c) 2019, Pierre-Anthony Lemieux <pal@palemieux.com>


Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const hb = require('handlebars');
const fs = require('fs');
const path = require('path');
const utils = require('./utilities.js');
const puppeteer = require('puppeteer');


const MELT_PATH = "main/melt.json";
const BUILD_PATH = "build";
const TEMPLATE_PATH = "templates/isdcf.hbs";
const PAGE_SITE_PATH = "isdcf.html";
const PDF_SITE_PATH = "isdcf-language-codes.pdf";
const DISPLAYNAMES_PATH = "node_modules/cldr-localenames-modern/main/en/languages.json";

/* instantiate template */

let template = hb.compile(
  fs.readFileSync(
    TEMPLATE_PATH,
    'utf8'
  )
);

if (!template) {
  throw "Cannot load HTML template";
}

/* load melt table */

let melt = JSON.parse(
  fs.readFileSync(
    MELT_PATH
  )
);

if (!melt) {
  throw "Cannot load MELT table";
}

/* load display names */

let displayNames = JSON.parse(
  fs.readFileSync(
    DISPLAYNAMES_PATH
  )
);

if (!displayNames) {
  throw "Cannot load CLDR display names";
}

/* build display name */

for (let i in melt) {
  let langtag = melt[i]["rfc5646Tag"];

  let ptag = utils.parseLanguageTag(langtag);

  let locale = utils.parsedTagToCLDRLocale(ptag);

  if (!locale) {
    throw "Cannot transform language tag to locale: " + langtag;
  }

  /* CLDR locale */

  melt[i].cldrLocale = utils.fromParsedTagToCanonicalTag(locale);

  /* add display name */

  let dn = utils.buildDisplayName(locale);

  if (!dn) {
    throw "Invalid language tag: " + langtag;
  }

  melt[i].displayName = dn;

}

/* build isdcfUse field */

for (let i in melt) {

  melt[i].isdcfUse = [];

  for (let j in melt[i].use) {
    switch (melt[i].use[j]) {
      case 'audio':
        melt[i].isdcfUse.push("Audio");
        break;
      case 'text':
        melt[i].isdcfUse.push("Subtitles");
        break;
    }

  }

}

/* create build directory */

fs.mkdirSync(BUILD_PATH, { recursive: true });

/* apply template */

var html = template({ "melt": melt, "pdf_path": PDF_SITE_PATH });

/* write HTML file */

fs.writeFileSync(path.join(BUILD_PATH, PAGE_SITE_PATH), html, 'utf8');

/* write pdf */

/* set the CHROMEPATH environment variable to provide your own Chrome executable */

var pptr_options = {};

if (process.env.CHROMEPATH) {
  pptr_options.executablePath = process.env.CHROMEPATH;
}

(async () => {
  const browser = await puppeteer.launch(pptr_options);
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({ path: path.join(BUILD_PATH, PDF_SITE_PATH).toString() })
  await browser.close();
})();

