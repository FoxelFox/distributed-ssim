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
	const apps = await identifiersRes.json();

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
				csv += result;
				document.body.innerText = csv
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


run();