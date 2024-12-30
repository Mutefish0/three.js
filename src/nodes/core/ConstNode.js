import InputNode from './InputNode.js';

class ConstNode extends InputNode {

	static get type() {

		return 'ConstNode';

	}

	constructor( value, nodeType = null ) {

		super( value, nodeType );

		this.isConstNode = true;

		const vType = typeof value;

		if ( vType === 'number' ) {

			this.uuid = nodeType ? `${nodeType}(${value})` : `${value}`;

		} else if ( vType === 'boolean' ) {

			this.uuid = `${value}`;

		} else if ( vType === 'undefined' ) {

			this.uuid = '';

		} else if ( value.isVector2 ) {

			this.uuid = `${nodeType || 'const'}(${value.x},${value.y})`;

		} else if ( value.isVector3 ) {

			this.uuid = `${nodeType || 'const'}(${value.x},${value.y},${value.z})`;

		} else if ( value.isVector4 ) {

			this.uuid = `${nodeType || 'const'}(${value.x},${value.y},${value.z},${value.w})`;

		}

	}

	generateConst( builder ) {

		return builder.generateConst( this.getNodeType( builder ), this.value );

	}

	generate( builder, output ) {

		const type = this.getNodeType( builder );

		return builder.format( this.generateConst( builder ), type, output );

	}

}

export default ConstNode;
