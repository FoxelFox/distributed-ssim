import {Server} from "socket.io";
import * as fs from "fs";

let csv = "p|c|s\n";


export class SSIMServer {
	constructor (
		private io: Server
	) {

		let ids = JSON.parse(fs.readFileSync("dist/identifiers.json").toString());
		try {
			csv = fs.readFileSync("results.csv").toString();
		} catch (e) {
			// ignore
		}

		let lines = csv.split("\n");
		lines = lines.splice(1, lines.length);
		const workTotal = ids.length;
		let workDone = 0;

		for(const line of lines) {
			const v = line.split("|");
			const p = v[0];
			let i = ids.indexOf(p);
			if (i !== -1) {
				workDone++;
				ids.splice(i, 1);
			}
		}

		let resultStatistic = {};

		let sendStatus = () => {
			io.sockets.emit("info", {
				workTotal,
				workDone,
				resultStatistic
			});
		};

		let writeFile = () => {
			fs.writeFileSync("results.csv", csv);
		};

		io.on('connection', function(socket){
			let name;
			let work = [];
			let threads;

			sendStatus();

			const sendWork = () => {
				const workNew = ids.splice(0, threads);
				if (workNew.length === 0) {
					writeFile();
				}
				socket.emit("work", workNew);
				work = work.concat(workNew);
			};

			socket.on("login", (user) => {
				name = user.name.slice(0, 64);
				threads = user.threads;
				console.log(name, "logged in with", user.threads, "threads");
				sendWork();
				sendWork(); // send twice work as threads
				sendStatus();
			});

			socket.on("results", (results) => {
				console.log(name, "contributed with", threads, "results");
				if (!resultStatistic[name]) {
					resultStatistic[name] = {
						contributions: 0
					}
				}
				resultStatistic[name].contributions += threads;

				for (let key in results) {
					for (let match of results[key]) {
						csv += [key, match.key, match.value].join("|") + "\n";
					}
					work.splice(work.indexOf(key), 1);
				}
				sendWork();
				workDone += threads;
				sendStatus();
			});

			socket.on("disconnect", () => {
				console.log(name, "disconnected");
				ids = ids.concat(work);
				writeFile();
			});
		});
	}
}