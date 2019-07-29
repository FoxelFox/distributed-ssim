import { spawn, Thread, Worker, Pool } from "threads"
import {SSIMWorker} from "./thread";

async function run() {
	const res = await fetch("4.json");
	const images = await res.json();
	let csv = "";

	for (const id in images) {
		images[id].data = new Buffer(images[id].data)
	}

	let apps = Object.keys(images);
	const count = apps.length;

	const pool = Pool(() => spawn<SSIMWorker>(new Worker("./thread")));

	try {
		let index = 0;
		while (index < apps.length) {
			const items = apps.slice(index, index + 1);
			pool.queue(async thread => {
				csv += await thread.work(items, apps, images);
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