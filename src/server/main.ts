import * as express from "express";
import * as io from "socket.io";
const app = express();
const fs = require('fs');
const expressStaticGzip = require('express-static-gzip');
const path = require('path');
const http = require('http');

import {SSIMServer} from "./ssim";

new SSIMServer(io(http));

app.use('/', expressStaticGzip(path.join(__dirname + '/../client'), {
	enableBrotli: true
}));

const server = http.createServer(app);

server.listen(3000);
