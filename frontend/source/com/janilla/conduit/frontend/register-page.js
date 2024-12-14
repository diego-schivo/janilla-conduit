import { SlottableElement } from "./web-components.js";

export default class RegisterPage extends SlottableElement {

	static get observedAttributes() {
		return ["slot"];
	}

	static get templateName() {
		return "register-page";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("RegisterPage.connectedCallback");
		super.connectedCallback();
		this.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		// console.log("RegisterPage.disconnectedCallback");
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleSubmit = async event => {
		// console.log("RegisterPage.handleSubmit", event);
		event.preventDefault();
		const ca = this.closest("conduit-app");
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += "/users";
		const r = await fetch(u, {
			method: "POST",
			headers: { ...ca.apiHeaders, "Content-Type": "application/json" },
			body: JSON.stringify({ user: Object.fromEntries(new FormData(event.target)) })
		});
		const j = await r.json();
		if (r.ok) {
			this.dispatchEvent(new CustomEvent("set-current-user", {
				bubbles: true,
				detail: { user: j.user }
			}));
			location.hash = "#/";
		} else {
			this.errorMessages = j ? Object.entries(j).flatMap(([k, v]) => v.map(x => `${k} ${x}`)) : null;
			this.requestUpdate();
		}
	}

	render() {
		// console.log("RegisterPage.render");
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.content ??= this.interpolatorBuilders[1]();
		this.appendChild(this.interpolator({
			content: this.slot ? this.content({ errorMessages: this.errorMessages }) : null
		}));
	}
}
