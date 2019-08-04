import { spawn, Thread, Worker, Pool } from "threads"
import {SSIMWorker} from "./thread";
import {loadImageBuffer} from "@foxel_fox/glib";
import * as fs from "fs";

const width = 32;
const height = 32;
const channels = 4;
const bytesPerImage = width * height * channels;

async function run() {
	console.log(location + "/32.jpg");
	const data = await loadImageBuffer(location + "32.jpg", "OffscreenCanvas"in window);
	const identifiersRes = await fetch("identifiers.json");
	let apps = await identifiersRes.json();

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
	const pool = Pool(() => spawn<SSIMWorker>(new Worker("./thread")));

	let results = [];

	try {
		let index = 0;
		while (index < apps.length) {
			const items = apps.slice(index, index + 1);
			pool.queue(async thread => {
				const result = await thread.work(items, apps, images);


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

					document.body.appendChild(div);

				}
			});
			index += 1;

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

run();