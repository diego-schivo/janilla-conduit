import { UpdatableElement } from "./web-components.js";

export default class PopularTags extends UpdatableElement {

	static get templateName() {
		return "popular-tags";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("PopularTags.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("PopularTags.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = event => {
		// console.log("PopularTags.handleClick", event);
		event.preventDefault();
		const el = event.target.closest('.tag-default');
		if (!el)
			return;
		this.dispatchEvent(new CustomEvent('select-tag', {
			bubbles: true,
			detail: { tag: el.textContent.trim() }
		}));
	}

	async update() {
		// console.log("PopularTags.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.loadingContent ??= this.interpolatorBuilders[1]();
		this.emptyContent ??= this.interpolatorBuilders[2]();
		this.nonemptyContent ??= this.interpolatorBuilders[3]();
		this.tags ??= await (async () => {
			this.appendChild(this.interpolator({ content: this.loadingContent() }));
			const ca = this.closest("conduit-app");
			const u = new URL(ca.dataset.apiUrl);
			u.pathname += "/tags";
			const j = await (await fetch(u, { headers: ca.apiHeaders })).json();
			return j.tags;
		})();
		this.appendChild(this.interpolator({
			content: this.tags.length
				? this.nonemptyContent({
					items: (() => {
						if (this.items?.length !== this.tags.length)
							this.items = this.tags.map(_ => this.interpolatorBuilders[4]());
						return this.tags.map((x, i) => this.items[i](x));
					})()
				})
				: this.emptyContent()
		}));
	}
}
