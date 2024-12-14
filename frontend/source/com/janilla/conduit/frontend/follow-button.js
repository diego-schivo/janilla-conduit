/*
 * MIT License
 *
 * Copyright (c) 2024 Diego Schivo
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
import { FlexibleElement } from "./flexible-element.js";

export default class FollowButton extends FlexibleElement {

	static get observedAttributes() {
		return ["data-active"];
	}

	static get templateName() {
		return "follow-button";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("FollowButton.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("FollowButton.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = async event => {
		// console.log("FollowButton.handleClick", event);
		event.stopPropagation();
		const ca = this.closest("conduit-app");
		if (!ca.currentUser) {
			location.hash = "#/login";
			return;
		}
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += `/profiles/${this.dataset.username}/follow`;
		const r = await fetch(u, {
			method: this.dataset.active === "true" ? "DELETE" : "POST",
			headers: ca.apiHeaders
		});
		if (r.ok) {
			const j = await r.json();
			this.dispatchEvent(new CustomEvent("toggle-follow", {
				bubbles: true,
				detail: j
			}));
		}
	}

	async updateDisplay() {
		// console.log("FollowButton.updateDisplay");
		await super.updateDisplay();
		this.interpolate ??= this.createInterpolateDom();
		this.appendChild(this.interpolate({
			...this.dataset,
			class: `btn btn-sm action-btn ${this.dataset.active === "true" ? "btn-secondary" : "btn-outline-secondary"}`,
			text: `${this.dataset.active === "true" ? "Unfollow" : "Follow"} ${this.dataset.username}`
		}));
	}
}
