import { UpdatableElement } from "./web-components.js";

export default class ArticlePreview extends UpdatableElement {

	static get observedAttributes() {
		return ["data-index"];
	}

	static get templateName() {
		return "article-preview";
	}

	constructor() {
		super();
	}

	get article() {
		return this.closest("article-list")?.articles[parseInt(this.dataset.index)];
	}

	set article(x) {
		this.closest("article-list").articles[parseInt(this.dataset.index)] = x;
	}

	connectedCallback() {
		// console.log("ArticlePreview.connectedCallback");
		super.connectedCallback();
		this.addEventListener("toggle-favorite", this.handleToggleFavorite);
	}

	disconnectedCallback() {
		// console.log("ArticlePreview.disconnectedCallback");
		this.removeEventListener("toggle-favorite", this.handleToggleFavorite);
	}

	handleToggleFavorite = event => {
		// console.log("ArticlePreview.handleToggleFavorite", event);
		this.article = event.detail.article;
		this.requestUpdate();
	}

	async update() {
		// console.log("ArticlePreview.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.content ??= this.interpolatorBuilders[1]();
		const a = this.article;
		this.appendChild(this.interpolator({
			content: a ? this.content({
				...a,
				authorHref: `#/@${a.author.username}`,
				href: `#/article/${a.slug}`,
				tags: (() => {
					if (this.tags?.length !== a.tagList.length)
						this.tags = a.tagList.map(_ => this.interpolatorBuilders[2]());
					return this.tags.map((x, i) => x(a.tagList[i]));
				})()
			}) : null
		}));
	}
}
