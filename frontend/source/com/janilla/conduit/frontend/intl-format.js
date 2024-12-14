import { UpdatableElement } from "./web-components.js";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

const formatters = {
	date: x => dateFormatter.format(new Date(x))
};

export default class IntlFormat extends UpdatableElement {

	static get observedAttributes() {
		return ["data-type", "data-value"];
	}

	constructor() {
		super();
	}

	async update() {
		// console.log("IntlFormat.update");
		if (!this.dataset.value) {
			this.textContent = "";
			return;
		}
		const f = this.dataset.type ? formatters[this.dataset.type] : null;
		this.textContent = f ? f(this.dataset.value) : this.dataset.value;
	}
}
