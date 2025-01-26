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
import { UpdatableHTMLElement } from "./updatable-html-element.js";

export default class SettingsPage extends UpdatableHTMLElement {

	static get templateName() {
		return "settings-page";
	}

	constructor() {
		super();
	}

	get historyState() {
		const s = this.state;
		return {
			...history.state,
			"settings-page": Object.fromEntries(["user"].map(x => [x, s[x]]))
		};
	}

	connectedCallback() {
		// console.log("SettingsPage.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
		this.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		// console.log("SettingsPage.disconnectedCallback");
		super.disconnectedCallback();
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleClick = event => {
		// console.log("ArticlePage.handleClick", event);
		if (!event.target.classList.contains("btn-outline-danger"))
			return;
		this.dispatchEvent(new CustomEvent("set-current-user", {
			bubbles: true,
			detail: { user: null }
		}));
		location.hash = "#/";
	}

	handleSubmit = async event => {
		// console.log("SettingsPage.handleSubmit", event);
		event.preventDefault();
		const rl = this.closest("root-layout");
		const u = new URL(rl.dataset.apiUrl);
		u.pathname += "/user";
		const u2 = Object.fromEntries(new FormData(event.target));
		const r = await fetch(u, {
			method: "PUT",
			headers: {
				...rl.state.apiHeaders,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ user: u2 })
		});
		const j = await r.json();
		this.state.errorMessages = !r.ok && j ? Object.entries(j).flatMap(([k, v]) => v.map(x => `${k} ${x}`)) : null;
		if (r.ok) {
			this.dispatchEvent(new CustomEvent("set-current-user", {
				bubbles: true,
				detail: { user: j.user }
			}));
			location.hash = `#/@${rl.state.currentUser.username}`;
		} else
			this.requestUpdate();
	}

	async updateDisplay() {
		// console.log("SettingsPage.updateDisplay");
		const s = this.state;
		if (!s.user) {
			const rl = this.closest("root-layout");
			s.user = rl.state.currentUser;
			history.replaceState(this.historyState, "");
		}
		this.appendChild(this.interpolateDom({
			$template: "",
			...s.user,
			errorMessages: s.errorMessages?.join(";")
		}));
	}
}
