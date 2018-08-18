// const cluster = require('cluster');
// const http = require('http');
// const numCPUs = require('os').cpus().length;

// console.log('numCPUs: ', numCPUs)
// console.log('cluster.isMaster: ', cluster.isMaster)

// if (cluster.isMaster) {
//   // Fork workers.
//   for (var i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`);
//   });
// } else {
//   // Workers can share any TCP connection
//   // In this case it is an HTTP server
//   http.createServer((req, res) => {
//     res.writeHead(200);
//     res.end('hello world\n');
//   }).listen(8000);
// }

const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  masterProcess();
} else {
  childProcess();
}

// function masterProcess() {
//   console.log(`Master ${process.pid} is running`);

//   for (let i = 0; i < numCPUs; i++) {
//     console.log(`Forking process number ${i}...`);
//     cluster.fork();
//   }

//   process.exit();
// }



function masterProcess() {
  let workers = [];
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    console.log(`Forking process number ${i}...`);

    const worker = cluster.fork();
    workers.push(worker);

    // Listen for messages from worker
    worker.on('message', function(message) {
      console.log(`Master ${process.pid} recevies message '${JSON.stringify(message)}' from worker ${worker.process.pid}`);
    });
  }

  // Send message to the workers
  workers.forEach(function(worker) {
    console.log(`Master ${process.pid} sends message to worker ${worker.process.pid}...`);
    worker.send({ msg: `Message from master ${process.pid}` });
  }, this);
}


// function childProcess() {
//   console.log(`Worker ${process.pid} started and finished`);

//   process.exit();
// }





function childProcess() {
  console.log(`Worker ${process.pid} started`);

  process.on('message', function(message) {
    console.log(`Worker ${process.pid} recevies message '${JSON.stringify(message)}'`);
  });

  console.log(`Worker ${process.pid} sends message to master...`);
  process.send({ msg: `Message from worker ${process.pid}` });

  console.log(`Worker ${process.pid} finished`);
}



