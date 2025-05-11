import Node from "../core/Node.js";
import { property } from "../core/PropertyNode.js";

class BlockNode extends Node {
	static get type() {
		return "BlockNode";
	}

	constructor(bodyNode) {
		super();

		this.bodyNode = bodyNode;
	}

	getNodeType(builder) {
		return this.bodyNode.getNodeType(builder);
	}

	setup(builder) {
		const bodyNode = this.bodyNode.cache();

		//

		const currentNodeBlock = builder.context.nodeBlock;

		builder.getDataFromNode(bodyNode).parentNodeBlock = currentNodeBlock;

		//
		const properties = builder.getNodeProperties(this);

		properties.bodyNode = bodyNode.context({ nodeBlock: bodyNode });
	}

	generate(builder, output) {
		const type = this.getNodeType(builder);

		const nodeData = builder.getDataFromNode(this);

		if (nodeData.nodeProperty !== undefined) {
			return nodeData.nodeProperty;
		}

		const { bodyNode } = builder.getNodeProperties(this);

		const needsOutput = output !== "void";
		const nodeProperty = needsOutput ? property(type).build(builder) : "";

		nodeData.nodeProperty = nodeProperty;

		builder.addFlowCode(`\n${builder.tab}{\n\n`).addFlowTab();

		let bodySnippet = bodyNode.build(builder, type);

		builder
			.removeFlowTab()
			.addFlowCode(builder.tab + "\t" + bodySnippet + "\n" + builder.tab + "}");

		builder.addFlowCode("\n\n");

		return builder.format(nodeProperty, type, output);
	}
}

export default BlockNode;
