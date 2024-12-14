import { UpdatableElement } from "./web-components.js";

export default class FollowButton extends UpdatableElement {

	static get observedAttributes() {
		return ["data-active"];
	}

	static get templateName() {
		return "follow-button";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("FollowButton.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("FollowButton.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = async event => {
		// console.log("FollowButton.handleClick", event);
		event.stopPropagation();
		const ca = this.closest("conduit-app");
		if (!ca.currentUser) {
			location.hash = "#/login";
			return;
		}
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += `/profiles/${this.dataset.username}/follow`;
		const r = await fetch(u, {
			method: this.dataset.active === "true" ? "DELETE" : "POST",
			headers: ca.apiHeaders
		});
		if (r.ok) {
			const j = await r.json();
			this.dispatchEvent(new CustomEvent("toggle-follow", {
				bubbles: true,
				detail: j
			}));
		}
	}

	async update() {
		// console.log("FollowButton.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.appendChild(this.interpolator({
			...this.dataset,
			class: `btn btn-sm action-btn ${this.dataset.active === "true" ? "btn-secondary" : "btn-outline-secondary"}`,
			text: `${this.dataset.active === "true" ? 'Unfollow' : 'Follow'} ${this.dataset.username}`
		}));
	}
}
