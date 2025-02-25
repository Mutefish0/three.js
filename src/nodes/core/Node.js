import { NodeUpdateType } from "./constants.js";
import { getNodeChildren } from "./NodeUtils.js";

const MathUtils = {
	seed: ((Date.now() % 10000) + Math.ceil(Math.random() * 100)).toString(36),
	id: 0,
	generateUUID: function () {
		return `${this.seed}${this.id++}`;
	},
};

let _nodeId = 0;

export const globalNodes = {};

class Node {
	static get type() {
		return "Node";
	}

	constructor(nodeType = null) {
		this.nodeType = nodeType;

		this.updateType = NodeUpdateType.NONE;
		this.updateBeforeType = NodeUpdateType.NONE;
		this.updateAfterType = NodeUpdateType.NONE;

		this.uuid = MathUtils.generateUUID();

		this.version = 0;

		this._cacheKey = null;
		this._cacheKeyVersion = 0;

		this.global = false;

		this.isNode = true;

		Object.defineProperty(this, "id", { value: _nodeId++ });
	}

	set needsUpdate(value) {
		if (value === true) {
			this.version++;
		}
	}

	get type() {
		return this.constructor.type;
	}

	onUpdate(callback, updateType) {
		this.updateType = updateType;
		this.update = callback.bind(this.getSelf());

		return this;
	}

	onFrameUpdate(callback) {
		return this.onUpdate(callback, NodeUpdateType.FRAME);
	}

	onRenderUpdate(callback) {
		return this.onUpdate(callback, NodeUpdateType.RENDER);
	}

	onObjectUpdate(callback) {
		return this.onUpdate(callback, NodeUpdateType.OBJECT);
	}

	onReference(callback) {
		this.updateReference = callback.bind(this.getSelf());

		return this;
	}

	getSelf() {
		// Returns non-node object.

		return this.self || this;
	}

	updateReference(/*state*/) {
		return this;
	}

	isGlobal(/*builder*/) {
		return this.global;
	}

	*getChildren() {
		for (const { childNode } of getNodeChildren(this)) {
			yield childNode;
		}
	}

	dispose() {
		this.dispatchEvent({ type: "dispose" });
	}

	getScope() {
		return this;
	}

	getHash(/*builder*/) {
		return this.uuid;
	}

	getUpdateType() {
		return this.updateType;
	}

	getUpdateBeforeType() {
		return this.updateBeforeType;
	}

	getUpdateAfterType() {
		return this.updateAfterType;
	}

	getElementType(builder) {
		const type = this.getNodeType(builder);
		const elementType = builder.getElementType(type);

		return elementType;
	}

	getNodeType(builder) {
		const nodeProperties = builder.getNodeProperties(this);

		if (nodeProperties.outputNode) {
			return nodeProperties.outputNode.getNodeType(builder);
		}

		return this.nodeType;
	}

	getShared(builder) {
		const hash = this.getHash(builder);
		const nodeFromHash = builder.getNodeFromHash(hash);

		return nodeFromHash || this;
	}

	setup(builder) {
		const nodeProperties = builder.getNodeProperties(this);

		let index = 0;

		for (const childNode of this.getChildren()) {
			nodeProperties["node" + index++] = childNode;
		}

		// return a outputNode if exists
		return null;
	}

	analyze(builder) {
		const usageCount = builder.increaseUsage(this);

		if (usageCount === 1) {
			// node flow children

			const nodeProperties = builder.getNodeProperties(this);

			for (const childNode of Object.values(nodeProperties)) {
				if (childNode && childNode.isNode === true) {
					childNode.build(builder);
				}
			}
		}
	}

	generate(builder, output) {
		const { outputNode } = builder.getNodeProperties(this);

		if (outputNode && outputNode.isNode === true) {
			return outputNode.build(builder, output);
		}
	}

	updateBefore(/*frame*/) {
		console.warn("Abstract function.");
	}

	updateAfter(/*frame*/) {
		console.warn("Abstract function.");
	}

	update(/*frame*/) {
		console.warn("Abstract function.");
	}

	build(builder, output = null) {
		const refNode = this.getShared(builder);

		if (this !== refNode) {
			return refNode.build(builder, output);
		}

		builder.addNode(this);
		builder.addChain(this);

		/* Build stages expected results:
			- "setup"		-> Node
			- "analyze"		-> null
			- "generate"	-> String
		*/
		let result = null;

		const buildStage = builder.getBuildStage();

		if (buildStage === "setup") {
			this.updateReference(builder);

			const properties = builder.getNodeProperties(this);

			if (properties.initialized !== true) {
				const stackNodesBeforeSetup = builder.stack.nodes.length;

				properties.initialized = true;
				properties.outputNode = this.setup(builder);

				if (
					properties.outputNode !== null &&
					builder.stack.nodes.length !== stackNodesBeforeSetup
				) {
					// !! no outputNode !!
					//properties.outputNode = builder.stack;
				}

				for (const childNode of Object.values(properties)) {
					if (childNode && childNode.isNode === true) {
						childNode.build(builder);
					}
				}
			}
		} else if (buildStage === "analyze") {
			this.analyze(builder);
		} else if (buildStage === "generate") {
			const isGenerateOnce = this.generate.length === 1;

			if (isGenerateOnce) {
				const type = this.getNodeType(builder);
				const nodeData = builder.getDataFromNode(this);

				result = nodeData.snippet;

				if (result === undefined) {
					result = this.generate(builder) || "";

					nodeData.snippet = result;
				} else if (
					nodeData.flowCodes !== undefined &&
					builder.context.nodeBlock !== undefined
				) {
					builder.addFlowCodeHierarchy(this, builder.context.nodeBlock);
				}

				result = builder.format(result, type, output);
			} else {
				result = this.generate(builder, output) || "";
			}
		}

		builder.removeChain(this);

		return result;
	}

	toString() {
		if (!this.gid) {
			this.gid = MathUtils.generateUUID();
		}
		globalNodes[this.gid] = this;
		return this.gid;
	}
}

export default Node;
