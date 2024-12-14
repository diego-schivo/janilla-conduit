import { UpdatableElement } from "./web-components.js";

export default class ErrorList extends UpdatableElement {

	static get observedAttributes() {
		return ["data-messages"];
	}

	static get templateName() {
		return "error-list";
	}

	constructor() {
		super();
	}

	get messages() {
		return this.dataset.messages ? this.dataset.messages.split(",") : [];
	}

	set messages(x) {
		this.dataset.messages = x.join();
	}

	async update() {
		// console.log("ErrorList.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		const mm = this.messages;
		if (this.items?.length !== mm.length)
			this.items = mm.map(_ => this.interpolatorBuilders[1]());
		this.appendChild(this.interpolator({
			items: this.items.map((x, i) => x(mm[i]))
		}));
	}
}
