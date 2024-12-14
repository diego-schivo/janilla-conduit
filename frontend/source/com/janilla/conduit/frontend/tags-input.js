import { UpdatableElement } from "./web-components.js";

export default class TagsInput extends UpdatableElement {

	static get observedAttributes() {
		return ["data-values"];
	}

	static get templateName() {
		return "tags-input";
	}

	constructor() {
		super();
	}

	get values() {
		return this.dataset.values ? this.dataset.values.split(",") : [];
	}

	set values(x) {
		this.dataset.values = x.join();
	}

	connectedCallback() {
		// console.log("TagsInput.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
		this.addEventListener("keydown", this.handleKeyDown);
	}

	disconnectedCallback() {
		// console.log("TagsInput.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("keydown", this.handleKeyDown);
	}

	handleClick = event => {
		// console.log("TagsInput.handleClick", event);
		const el = event.target.closest('.ion-close-round');
		if (!el)
			return;
		event.preventDefault();
		const el2 = el.nextElementSibling;
		const v = el2.textContent;
		this.values = this.values.filter(x => x !== v);
	}

	handleKeyDown = event => {
		// console.log("TagsInput.handleKeyDown", event);
		if (event.key !== 'Enter')
			return;
		event.preventDefault();
		const el = event.target;
		if (!this.values.includes(el.value))
			this.values = [...this.values, el.value];
		el.value = '';
	}

	async update() {
		// console.log("TagsInput.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		const vv = this.values;
		if (this.tags?.length !== vv.length)
			this.tags = vv.map(_ => this.interpolatorBuilders[1]());
		this.appendChild(this.interpolator({
			tags: this.tags.map((x, i) => x(vv[i]))
		}));
	}
}
