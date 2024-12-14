import { SlottableElement } from "./web-components.js";

export default class EditorPage extends SlottableElement {

	static get observedAttributes() {
		return ["data-slug", "slot"];
	}

	static get templateName() {
		return "editor-page";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("EditorPage.connectedCallback");
		super.connectedCallback();
		this.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		// console.log("EditorPage.disconnectedCallback");
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleSubmit = async event => {
		// console.log("EditorPage.handleSubmit", event);
		event.preventDefault();
		const ca = this.closest("conduit-app");
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += this.dataset.slug ? `/articles/${this.dataset.slug}` : "/articles";
		const r = await fetch(u, {
			method: this.dataset.slug ? "PUT" : "POST",
			headers: { ...ca.apiHeaders, "Content-Type": "application/json" },
			body: JSON.stringify({
				article: [...new FormData(event.target).entries()].reduce((x, y) => {
					switch (y[0]) {
						case "tagList":
							x.tagList ??= [];
							x.tagList.push(y[1]);
							break;
						default:
							x[y[0]] = y[1];
							break;
					}
					return x;
				}, {})
			})
		});
		const j = await r.json();
		if (r.ok)
			location.hash = `#/article/${j.article.slug}`;
		else {
			this.errorMessages = j ? Object.entries(j).flatMap(([k, v]) => v.map(x => `${k} ${x}`)) : null;
			this.requestUpdate();
		}
	}

	async computeState() {
		// console.log("EditorPage.computeState");
		if (!this.dataset.slug)
			return null;
		const ca = this.closest("conduit-app");
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += `/articles/${this.dataset.slug}`;
		const j = await (await fetch(u, { headers: ca.apiHeaders })).json();
		return j.article;
	}

	render() {
		// console.log("EditorPage.render");
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.content ??= this.interpolatorBuilders[1]();
		this.appendChild(this.interpolator({
			content: this.slot && (!this.dataset.slug || this.state) ? this.content({
				...this.state,
				tagList: this.state?.tagList.join(),
				errorMessages: this.errorMessages
			}) : null
		}));
	}
}
