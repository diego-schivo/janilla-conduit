import { UpdatableElement } from "./web-components.js";

export default class FavoriteButton extends UpdatableElement {

	static get observedAttributes() {
		return ["data-active", "data-count"];
	}

	static get templateName() {
		return "favorite-button";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("FavoriteButton.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("FavoriteButton.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = async event => {
		// console.log("FavoriteButton.handleClick", event);
		event.stopPropagation();
		const ca = this.closest("conduit-app");
		if (!ca.currentUser) {
			location.hash = "#/login";
			return;
		}
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += `/articles/${this.dataset.slug}/favorite`;
		const r = await fetch(u, {
			method: this.dataset.active === "true" ? "DELETE" : "POST",
			headers: ca.apiHeaders
		});
		if (r.ok) {
			const j = await r.json();
			this.dispatchEvent(new CustomEvent("toggle-favorite", {
				bubbles: true,
				detail: j
			}));
		}
	}

	async update() {
		// console.log("FavoriteButton.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.previewContent ??= this.interpolatorBuilders[1]();
		this.content ??= this.interpolatorBuilders[2]();
		this.appendChild(this.interpolator({
			...this.dataset,
			class: `btn btn-sm ${this.dataset.active === "true" ? "btn-primary" : "btn-outline-primary"} ${this.dataset.preview === "true" ? "pull-xs-right" : ""}`,
			content: this.dataset.preview === "true"
				? this.previewContent(this.dataset)
				: this.content({
					text: `${this.dataset.active === "true" ? 'Unfavorite' : 'Favorite'} Article`,
					count: `(${this.dataset.count})`
				})
		}));
	}
}
