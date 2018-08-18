const axios = require('axios');
const marked = require('marked');
const config = require('./config.js');
const db = require('./dbhelpers.js');

// FETCH GITHUB READMES
  axios({
    method:'get',
    url:`https://api.github.com/repositories?since=364`,
    headers: {Authorization: config.apiKey}
  })
  .then(function(response) {
    console.log('===================')
    console.log('response ', response)
    // const totalPages = parseInt(response.headers.link.split(',')[1].match(/page=(\d*)/)[1])
    // grabEntries(response);
  });



// function callNext(next) {
//   axios(next)
//   .then((response) => {
//     grabEntries(response)
//   })
//   .catch(err => err)
// }

// async function setObject(repo, i, arr) {
//   return new Promise((resolve, reject) => {
//     axios({
//       method:'get',
//       url:`https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/README.md`,
//       headers: {Authorization: config.apiKey},
//     })
//     .then(result => {
//       let buff = new Buffer(result.data.content, 'base64')
//       let text = buff.toString('ascii')
//       let html = marked(text);
//       let entry = {
//         title: repo.name,
//         description: repo.description,
//         content: html,
//       }

//       // INSERT READMES IN DATABSE
//       db.addArticle(entry, (success) => console.log(success))
//       resolve(entry.title)
//     })
//     .catch(err => {
//       resolve('')
//     })
//   });
// }


// function grabEntries(response) {
//   let allEntries = [];
//   let nextUrl, nextPg, currentPg;
//   let nextGroup = response.headers.link.split(',').filter(link => link.includes('rel=\"next\"'))[0]
//   if(nextGroup) {
//     nextUrl = nextGroup.match(/\<(.*)\>\;\s*rel=\"next\"/)[1]
//     nextPg = nextUrl.match(/page=(\d*)/)[1]
//     currentPg = nextPg - 1;
//   }

//   // GRAB NEXT PAGE OF API RESULTS
//   Promise.all(response.data.items.map(setObject))
//   .then((info) => {
//     callNext(nextUrl)
//   })
//   .catch(err => console.error(err.message))
// }
