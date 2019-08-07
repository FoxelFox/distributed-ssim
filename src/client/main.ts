import { spawn, Thread, Worker, Pool } from "threads"
import {SSIMWorker} from "./thread";
import {loadImageBuffer} from "@foxel_fox/glib/lib/image-loader";
import * as io from "socket.io-client";
const socket = io();

const width = 32;
const height = 32;
const channels = 4;
const bytesPerImage = width * height * channels;
const infoDIV = document.getElementById("info");
const workDIV = document.getElementById("work");
const pool = Pool(() => spawn<SSIMWorker>(new Worker("./thread")));
var data;
var identifiersRes;
var apps;

workDIV.style.display = "flex";
workDIV.style.flexDirection = "column-reverse";

init().then(() => {
	document.getElementById("login").hidden = false;
	window["start"] = () => {
		document.getElementById("login").hidden = true;
		socket.emit("login", {
			name: (<any>document.getElementById("name")).value,
			threads: navigator.hardwareConcurrency
		});
	};
});



socket.on("work", function(work) {
	console.log(work);
	run(work).then((results) => {
		socket.emit("results", results);
	})
});

socket.on("info", (info) => {
	if (infoDIV.firstChild) {
		infoDIV.removeChild(infoDIV.firstChild);
	}

	const div = document.createElement("div");
	const work = document.createElement("span");
	work.innerText = "work: \t" + info.workDone + " / " + info.workTotal + " | " + (info.workDone / info.workTotal * 100).toFixed(2) + "%";

	const stats = document.createElement("div");
	stats.style.display = "flex";
	stats.style.flexDirection = "column-reverse";

	for (const name in info.resultStatistic) {
		const span = document.createElement("span");
		span.innerText = info.resultStatistic[name].contributions + "\t" + name;
		span.style.order = info.resultStatistic[name].contributions;
		stats.appendChild(span);
	}

	div.appendChild(stats);
	div.appendChild(work);
	infoDIV.appendChild(div);

});

function run(work: string[]) {
	return new Promise(async (resolve) => {
		const images = {};

		let i = 0;
		for (const id of apps) {
			const startIndex = i * bytesPerImage;
			images[id] = {
				data: data.slice(startIndex, startIndex + bytesPerImage),
				width,
				height,
				channels
			};
			i++
		}

		let csv = "";

		const count = apps.length;


		let results = {};

		try {
			let finishedWork = 0;
			const workTotal = work.length;
			while (work.length) {
				const items = work.splice(0, 1);

				pool.queue(async thread => {
					const result = await thread.work(items, apps, images);

					for (const key in result) {
						results[key] = result[key];
					}

					for(const id in result) {
						console.log(id);
						const matchImages = [images[id].data];
						const div = document.createElement("div");
						div.style.height = "40px";

						createCanvasImage(images[id].data, div, "rgb(" + 2.0 * (1 - result[id][0].value) * 255 + "," + 2.0 * result[id][0].value * 255 + ",0)");

						let sum = 0;
						let i = 2;
						for (const match of result[id]) {
							const color = "rgb(" + 2.0 * (1 - match.value) * 255 + "," + 2.0 * match.value * 255 + ",0)";
							createCanvasImage(images[match.key].data, div, color);
							sum += (match.value + 1) / i;
							i *= 2;
						}

						div.style.order = Math.floor(sum * 100000).toString();

						workDIV.appendChild(div);

					}

					if(++finishedWork == workTotal) {
						resolve(results);
					}

				});


			}
		} catch (e) {
			console.log(e);
			// fuck it
		}

		try {
			await pool.completed();
			await pool.terminate();
		} catch (e) {

		}
	});

}

function createCanvasImage(data, parent,color) {
	const resultImage = new Uint8ClampedArray(data);

	const canvas = document.createElement('canvas');
	canvas.width  = width;
	canvas.height = height;
	canvas.style.borderColor = color;
	canvas.style.borderStyle = "solid";
	canvas.style.borderWidth = "2px";
	canvas.style.margin = "2px";
	const ctx = canvas.getContext("2d");

	ctx.putImageData(new ImageData(resultImage, width , height), 0, 0);
	parent.appendChild(canvas);
}

async function init() {
	data = await loadImageBuffer(location + "32.jpg", "OffscreenCanvas"in window);
	identifiersRes = await fetch("identifiers.json");
	apps = await identifiersRes.json();
}
