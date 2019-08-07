import * as express from "express";
const app = express();
const fs = require('fs');
const expressStaticGzip = require('express-static-gzip');
const path = require('path');
const http = require('http');
import {SSIMServer} from "./ssim";


app.use('/', expressStaticGzip(path.join(__dirname + '/../'), {
	enableBrotli: true
}));

const server = http.createServer(app);

server.listen(3001);

new SSIMServer(require("socket.io")(server));
