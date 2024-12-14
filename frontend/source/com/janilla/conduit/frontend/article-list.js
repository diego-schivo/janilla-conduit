import { UpdatableElement } from "./web-components.js";

export default class ArticleList extends UpdatableElement {

	static get observedAttributes() {
		return ["data-href"];
	}

	static get templateName() {
		return "article-list";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("ArticleList.connectedCallback");
		super.connectedCallback();
		this.addEventListener("select-page", this.handleSelectPage);
	}

	disconnectedCallback() {
		// console.log("ArticleList.disconnectedCallback");
		this.removeEventListener("select-page", this.handleSelectPage);
	}

	handleSelectPage = event => {
		// console.log("ArticleList.handleSelectPage", event);
		this.pageNumber = event.detail.pageNumber;
		this.requestUpdate();
	}

	async update() {
		// console.log("ArticleList.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.loadingContent ??= this.interpolatorBuilders[1]();
		this.emptyContent ??= this.interpolatorBuilders[2]();
		this.nonemptyContent ??= this.interpolatorBuilders[3]();
		this.appendChild(this.interpolator({ content: this.loadingContent() }));
		if (this.dataset.href) {
			const u = new URL(this.dataset.href);
			u.searchParams.append('skip', ((this.pageNumber ?? 1) - 1) * 10);
			u.searchParams.append('limit', 10);
			const j = await (await fetch(u, { headers: this.closest("conduit-app").apiHeaders })).json();
			console.log("ArticleList.update", j);
			this.articles = j.articles;
			this.articlesCount = j.articlesCount;
			this.pageNumber = 1;
		} else {
			this.articles = null;
			this.articlesCount = null;
			this.pageNumber = null;
		}
		this.appendChild(this.interpolator({
			content: this.articles?.length
				? this.nonemptyContent({
					previews: (() => {
						if (this.previews?.length !== this.articles.length)
							this.previews = this.articles.map(_ => this.interpolatorBuilders[4]());
						return this.previews.map((x, i) => x({ index: i }));
					})(),
					pagesCount: this.articlesCount != null ? Math.ceil(this.articlesCount / 10) : null,
					pageNumber: this.pageNumber
				})
				: this.emptyContent()
		}));
	}
}
