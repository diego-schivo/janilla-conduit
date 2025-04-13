/*
 * MIT License
 *
 * Copyright (c) 2024-2025 Diego Schivo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { WebComponent } from "./web-component.js";

export default class CommentList extends WebComponent {

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
		super.disconnectedCallback();
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleClick = async event => {
		// console.log("CommentList.handleClick", event);
		if (!event.target.matches(".ion-trash-a"))
			return;
		event.preventDefault();
		const el = event.target.closest(".card");
		const els = el.parentElement.querySelectorAll(":scope > .card");
		const i = Array.prototype.findIndex.call(els, x => x === el);
		const ap = this.closest("article-page");
		const c = ap.state.comments[i];
		const rl = this.closest("root-layout");
		const u = new URL(rl.dataset.apiUrl);
		u.pathname += `/articles/${ap.dataset.slug}/comments/${c.id}`;
		const r = await fetch(u, {
			method: "DELETE",
			headers: rl.state.apiHeaders
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
		const rl = this.closest("root-layout");
		const u = new URL(rl.dataset.apiUrl);
		const ap = this.closest("article-page");
		u.pathname += `/articles/${ap.dataset.slug}/comments`;
		const r = await fetch(u, {
			method: "POST",
			headers: {
				...rl.state.apiHeaders,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ comment: Object.fromEntries(new FormData(event.target)) })
		});
		const j = await r.json();
		this.state.errorMessages = !r.ok && j ? Object.entries(j).flatMap(([k, v]) => v.map(x => `${k} ${x}`)) : null;
		if (r.ok) {
			event.target.elements["body"].value = "";
			this.dispatchEvent(new CustomEvent("add-comment", {
				bubbles: true,
				detail: { comment: j.comment }
			}));
		} else
			this.requestDisplay();
	}

	async updateDisplay() {
		// console.log("CommentList.updateDisplay");
		const rl = this.closest("root-layout");
		const ap = this.closest("article-page");
		this.appendChild(this.interpolateDom({
			$template: "",
			form: rl.state.currentUser ? {
				$template: "authenticated",
				...rl.state.currentUser,
				errorMessages: this.errorMessages
			} : { $template: "unauthenticated" },
			cards: ap.state.comments.map(x => ({
				$template: "card",
				...x,
				modOptions: x.author.username === rl.state.currentUser?.username ? { $template: "mod-options" } : null
			}))
		}));
	}
}
