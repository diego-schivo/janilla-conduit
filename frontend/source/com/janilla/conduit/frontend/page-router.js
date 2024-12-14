import { UpdatableElement } from "./web-components.js";

function updateElement(element, active, more) {
	if (active) {
		console.log("PageRouter.updateElement", element);
		element.setAttribute("slot", "content");
	} else
		element.removeAttribute("slot");

	if (more)
		more(element, active);
}

export default class PageRouter extends UpdatableElement {

	static get observedAttributes() {
		return ["data-path"];
	}

	static get templateName() {
		return "page-router";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	async update() {
		// console.log("PageRouter.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.shadowRoot.appendChild(this.interpolator());
		const nn = this.dataset.path.split("/");
		updateElement(this.querySelector("article-page"), nn[1] === "article", (el, a) => {
			if (a)
				el.setAttribute("data-slug", nn[2]);
			else
				el.removeAttribute("data-slug");
		});
		updateElement(this.querySelector("editor-page"), nn[1] === "editor", (el, a) => {
			if (a && nn[2])
				el.setAttribute("data-slug", nn[2]);
			else
				el.removeAttribute("data-slug");
		});
		updateElement(this.querySelector("home-page"), nn[1] === "");
		updateElement(this.querySelector("login-page"), nn[1] === "login");
		updateElement(this.querySelector("profile-page"), nn[1]?.startsWith("@"), (el, a) => {
			if (a)
				el.setAttribute("data-username", decodeURIComponent(nn[1].substring(1)));
			else
				el.removeAttribute("data-username");
		});
		updateElement(this.querySelector("register-page"), nn[1] === "register");
		updateElement(this.querySelector("settings-page"), nn[1] === "settings");
	}
}
