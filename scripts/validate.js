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

const fs = require('fs');
const path = require('path');
const ajv = require('ajv');
const utils = require('./utilities.js')


const MELT_PATH = "main/melt.json";
const MELTSCHEMA_PATH = "schemas/melt.schema.json";

/* instantiate the validator */

var validator_factory = new ajv();

let validator = validator_factory.compile(
  JSON.parse(
    fs.readFileSync(
      MELTSCHEMA_PATH
    )
  )
);

/* load the MELT table */

let melt = JSON.parse(
  fs.readFileSync(
    MELT_PATH
  )
)

if (! melt) {
  throw "Cannot load MELT table";
}

/* validate the table against the published schema */

if (! validator(melt)) {
  console.log(validator.errors);
  throw "Table fails validation";
};

/* validate entries */

for(let i in melt) {

  /* an RFC 5646 language tag is required */

  let langtag = melt[i]["rfc5646Tag"];

  if (! langtag) {
    throw "Missing RFC5646 language tag name for entry #" + i;
  }

  /* the RFC 5646 language tag must be a valid CLDR locale */

  let ptag = utils.parseLanguageTag(langtag);

  let locale = utils.parsedTagToCLDRLocale(ptag);

  if (!locale) {
    throw "Cannot transform language tag to locale: " + langtag;
  }

}