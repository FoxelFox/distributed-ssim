import {expose} from "threads/dist";
import * as ssim from "image-ssim/dist/image-ssim";

const worker = {


	work(items, apps, images) {
		let csv = "";
		let result = {};
		for (const item of items) {
			const values = [];

			for (const y of apps) {
				if (item !== y) {
					values.push({key: y, value: ssim.compare(images[item], images[y]).ssim});
				}
			}
			result[item] = values.sort((a, b) => b.value - a.value).slice(0, 16);
		}

		return result;
	}
};

export type SSIMWorker = typeof worker;

expose(worker);
