import { UpdatableElement } from "./web-components.js";

export default class NavLink extends UpdatableElement {

	static get observedAttributes() {
		return ["data-href", "data-icon", "data-image"];
	}

	static get templateName() {
		return "nav-link";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	async update() {
		// console.log("NavLink.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.icon ??= this.interpolatorBuilders[1]();
		this.image ??= this.interpolatorBuilders[2]();
		this.shadowRoot.appendChild(this.interpolator({
			...this.dataset,
			icon: this.dataset.icon ? this.icon({ class: this.dataset.icon }) : null,
			image: this.dataset.image ? this.image({ src: this.dataset.image }) : null
		}));
	}
}
