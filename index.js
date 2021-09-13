// run `node index.js` in the terminal

console.log(`Hello Node.js v${process.versions.node}!`);

const http = require('http');
const fs = require('fs');
const path = require('path');
const server = http.createServer((req, res) => {
  try {
    enableCors(res);
    console.log('req received');
    const url = req.url;
    if (url.startsWith('/postit')) {
      noteApiRouter(url, req, res);
    } else {
      serveStaticFile(url, res);
    }
  } catch (ex) {
    console.error(ex);
    res.writeHead(500);
    res.end('server error');
  }
});

function noteApiRouter(url, req, res) {
  const methodType = req.method.toUpperCase();
  switch (methodType) {
    case 'GET':
      getMethodHandler(url, req, res);
      break;
    case 'POST':
      postMethodHandler(url, req, res);
      break;
    case 'PUT':
      putMethodHandler(url, req, res);
      break;
    case 'DELETE':
      deleteMethodHandler(url, req, res);
      break;
    case 'OPTIONS':
      res.writeHead(204);
      res.end();
      break;
    default:
      res.writeHead(400);
      res.end('not found error');
  }
}

const noteList = [
  {
    id: 1,
    text: 'thia is note'
  }
];

const getMethodHandler = (url, req, res) => {
  res.writeHead(200);
  res.end(JSON.stringify(noteList));
};

const postMethodHandler = (url, req, res) => {
  res.writeHead(200);
  console.log('post called');
  let data = '';
  req.on('data', chunk => {
    data += chunk;
    console.log('received data', chunk);
  });
  req.on('end', () => {
    try {
      const noteReq = JSON.parse(data);
      console.log('noteReq ', noteReq);
      const maxId = Math.max(...noteList.map(n => n.id));
      const newNote = { id: maxId + 1, text: noteReq.text };
      noteList.push(newNote);
      console.log('pushing new note');
      res.write(JSON.stringify(newNote));
      res.end();
    } catch (ex) {
      console.error(ex);
      res.writeHead(500);
      res.end('server error');
    }
  });
};

const putMethodHandler = (url, req, res) => {
  res.writeHead(200);
  let data = '';
  console.log('url', url);
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    handleUpdateNote(url, data, res);
  });
};

function handleUpdateNote(url, jsonBody, res) {
  try {
    const path = url;

    const parts = path.split('/');
    const idParam = Number(parts[parts.length - 1]);
    console.log('parts', parts);
    console.log('idParam', idParam);
    console.log('jsonBody', jsonBody);
    const noteReq = JSON.parse(jsonBody);
    const note = noteList.find(n => n.id === idParam);
    note.text = noteReq.text;
    res.write(JSON.stringify(note));
    res.end();
  } catch (ex) {
    console.error('handling expection', ex);
    res.writeHead(500);
    res.end();
    console.log('server error occurred');
  }
}

const deleteMethodHandler = (url, req, res) => {
  res.writeHead(200);
  const path = url;

  const parts = path.split('/');
  const idParam = Number(parts[parts.length - 1]);
  const noteIndex = noteList.findIndex(n => n.id === idParam);
  noteList.splice(noteIndex, 1);
  res.end();
};

function enableCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Max-Age', 2592000);
  res.setHeader('Access-Control-Allow-Headers', '*');
}
server.listen(8080);

console.log('server started');

function serveStaticFile(filePath = '/index.html', res) {
  if (filePath === '/') {
    filePath = '/index.html';
  }
  const ext = path.extname(filePath);
  const mimeType = getMimeTypeByFileExt(ext);
  console.log(' ext type', ext, mimeType);
  console.log('truying to read ', filePath);
  fs.readFile(path.join(__dirname, 'static', filePath), 'utf8', function(
    err,
    data
  ) {
    if (err) {
      console.error(err);
      res.writeHead(404);
      res.end('Not Found ' + filePath);
      return;
    }
    res.writeHead(200, {
      'content-type': mimeType
    });
    res.write(data);
    res.end();
  });
}

function getMimeTypeByFileExt(extn) {
  switch (extn) {
    case '.html':
    case '.css':
      return 'text/html';
    case '.js':
      return 'application/javascript';
    case '.png':
      return 'image/png';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'text/html';
  }
}
