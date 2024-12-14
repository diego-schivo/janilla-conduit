import { SlottableElement } from "./web-components.js";

export default class SettingsPage extends SlottableElement {

	static get observedAttributes() {
		return ["slot"];
	}

	static get templateName() {
		return "settings-page";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("SettingsPage.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
		this.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		// console.log("SettingsPage.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleClick = event => {
		// console.log("ArticlePage.handleClick", event);
		if (!event.target.matches(".btn-outline-danger"))
			return;
		event.preventDefault();
		this.dispatchEvent(new CustomEvent("set-current-user", {
			bubbles: true,
			detail: { user: null }
		}));
		location.hash = '#/';
	}

	handleSubmit = async event => {
		// console.log("SettingsPage.handleSubmit", event);
		event.preventDefault();
		const ca = this.closest("conduit-app");
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += "/user";
		const r = await fetch(u, {
			method: "PUT",
			headers: { ...ca.apiHeaders, "Content-Type": "application/json" },
			body: JSON.stringify({ user: Object.fromEntries(new FormData(event.target)) })
		});
		const j = await r.json();
		if (r.ok) {
			this.dispatchEvent(new CustomEvent("set-current-user", {
				bubbles: true,
				detail: { user: j.user }
			}));
			location.hash = `#/@${ca.currentUser.username}`;
		} else {
			this.errorMessages = j ? Object.entries(j).flatMap(([k, v]) => v.map(x => `${k} ${x}`)) : null;
			this.requestUpdate();
		}
	}

	render() {
		// console.log("SettingsPage.render");
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.content ??= this.interpolatorBuilders[1]();
		const ca = this.closest("conduit-app");
		this.appendChild(this.interpolator({
			content: this.slot && ca.currentUser ? this.content({
				...ca.currentUser,
				errorMessages: this.errorMessages
			}) : null
		}));
	}
}
