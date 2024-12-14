import { UpdatableElement } from "./web-components.js";

export default class CommentList extends UpdatableElement {

	static get templateName() {
		return "comment-list";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("CommentList.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
		this.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		// console.log("CommentList.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleClick = async event => {
		// console.log("CommentList.handleClick", event);
		if (!event.target.matches(".ion-trash-a"))
			return;
		event.preventDefault();
		const ca = this.closest("conduit-app");
		const ap = this.closest("article-page");
		const el = event.target.closest(".card");
		const i = Array.prototype.findIndex.call(el.parentElement.querySelectorAll(":scope > .card"), x => x === el);
		const c = ap.state.comments[i];
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += `/articles/${ap.state.article.slug}/comments/${c.id}`;
		const r = await fetch(u, {
			method: "DELETE",
			headers: ca.apiHeaders
		});
		if (r.ok)
			this.dispatchEvent(new CustomEvent("remove-comment", {
				bubbles: true,
				detail: { comment: c }
			}));
	}

	handleSubmit = async event => {
		// console.log("CommentList.handleSubmit", event);
		event.preventDefault();
		const ca = this.closest("conduit-app");
		const ap = this.closest("article-page");
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += `/articles/${ap.state.article.slug}/comments`;
		const r = await fetch(u, {
			method: "POST",
			headers: { ...ca.apiHeaders, "Content-Type": "application/json" },
			body: JSON.stringify({ comment: Object.fromEntries(new FormData(event.target)) })
		});
		const j = await r.json();
		if (r.ok) {
			event.target.elements["body"].value = "";
			this.dispatchEvent(new CustomEvent("add-comment", {
				bubbles: true,
				detail: { comment: j.comment }
			}));
		} else {
			this.errorMessages = j ? Object.entries(j).flatMap(([k, v]) => v.map(x => `${k} ${x}`)) : null;
			this.requestUpdate();
		}
	}

	async update() {
		// console.log("CommentList.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.authenticated ??= this.interpolatorBuilders[1]();
		this.unauthenticated ??= this.interpolatorBuilders[2]();
		const ca = this.closest("conduit-app");
		const ap = this.closest("article-page");
		if (this.cards?.length !== ap.state.comments.length) {
			this.cards = ap.state.comments.map(_ => this.interpolatorBuilders[3]());
			this.modOptions = this.cards.map(_ => this.interpolatorBuilders[4]());
		}
		this.appendChild(this.interpolator({
			form: ca.currentUser ? this.authenticated({
				...ca.currentUser,
				errorMessages: this.errorMessages
			}) : this.unauthenticated(),
			cards: this.cards.map((x, i) => {
				const c = ap.state.comments[i];
				return x({
					...c,
					modOptions: c.author.username === ca.currentUser?.username ? this.modOptions[i]() : null
				});
			})
		}));
	}
}
