import { UpdatableElement } from "./web-components.js";

export default class PaginationNav extends UpdatableElement {

	static get observedAttributes() {
		return ["data-pages-count", "data-page-number"];
	}

	static get templateName() {
		return "pagination-nav";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("PaginationNav.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("PaginationNav.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = event => {
		// console.log("PaginationNav.handleClick", event);
		event.preventDefault();
		const el = event.target.closest(".page-item");
		if (!el || el.classList.contains("active"))
			return;
		const pn = parseInt(el.textContent.trim());
		this.dispatchEvent(new CustomEvent("select-page", {
			bubbles: true,
			detail: { pageNumber: pn }
		}));
	}

	async update() {
		// console.log("PaginationNav.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		const pc = this.dataset.pagesCount ? parseInt(this.dataset.pagesCount) : 0;
		if (this.items?.length !== pc)
			this.items = pc > 1 ? Array.from({ length: pc }, _ => this.interpolatorBuilders[1]()) : null;
		const pn = this.dataset.pageNumber ? parseInt(this.dataset.pageNumber) : 1;
		this.appendChild(this.interpolator({
			items: this.items?.map((x, i) => x({
				class: `page-item ${i + 1 === pn ? "active" : ""}`,
				number: i + 1
			}))
		}));
	}
}
