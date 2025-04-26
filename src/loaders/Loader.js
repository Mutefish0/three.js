import { DefaultLoadingManager } from "./LoadingManager.js";

class Loader {
	constructor(manager) {
		this.manager = manager !== undefined ? manager : DefaultLoadingManager;

		this.crossOrigin = "anonymous";
		this.withCredentials = false;
		this.path = "";
		this.resourcePath = "";
		this.requestHeader = {};
	}

	load(/* url, onLoad, onProgress, onError */) {}

	loadAsync(url, onProgress, options) {
		const scope = this;

		return new Promise(function (resolve, reject) {
			scope.load(url, resolve, onProgress, reject, options);
		});
	}

	parse(/* data */) {}

	setCrossOrigin(crossOrigin) {
		this.crossOrigin = crossOrigin;
		return this;
	}

	setWithCredentials(value) {
		this.withCredentials = value;
		return this;
	}

	setPath(path) {
		this.path = path;
		return this;
	}

	setResourcePath(resourcePath) {
		this.resourcePath = resourcePath;
		return this;
	}

	setRequestHeader(requestHeader) {
		this.requestHeader = requestHeader;
		return this;
	}
}

Loader.DEFAULT_MATERIAL_NAME = "__DEFAULT";

export { Loader };
